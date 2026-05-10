const EARTH_RADIUS_METERS = 6371000

function toRadians(value) {
  return (Number(value) * Math.PI) / 180
}

function roundCoordinate(value) {
  return Math.round((Number(value) + Number.EPSILON) * 1000000) / 1000000
}

function round2(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

function average(values) {
  if (!values.length) return 0
  return round2(values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length)
}

function topItem(values) {
  const counts = values.reduce((acc, value) => {
    if (!value) return acc
    acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {})

  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? ''
}

export function haversineDistanceMeters(a, b) {
  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)
  const deltaLat = toRadians(b.latitude - a.latitude)
  const deltaLon = toRadians(b.longitude - a.longitude)
  const sinLat = Math.sin(deltaLat / 2)
  const sinLon = Math.sin(deltaLon / 2)
  const c =
    2 *
    Math.atan2(
      Math.sqrt(sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon),
      Math.sqrt(1 - (sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon)),
    )

  return EARTH_RADIUS_METERS * c
}

function coordinateBounds(points) {
  if (!points.length) {
    return {
      north: 0,
      south: 0,
      east: 0,
      west: 0,
    }
  }

  return {
    north: roundCoordinate(Math.max(...points.map((point) => point.latitude))),
    south: roundCoordinate(Math.min(...points.map((point) => point.latitude))),
    east: roundCoordinate(Math.max(...points.map((point) => point.longitude))),
    west: roundCoordinate(Math.min(...points.map((point) => point.longitude))),
  }
}

function centroid(points) {
  if (!points.length) return { latitude: 0, longitude: 0 }

  const meanLat = points.reduce((s, p) => s + Number(p.latitude || 0), 0) / points.length
  const meanLon = points.reduce((s, p) => s + Number(p.longitude || 0), 0) / points.length

  return {
    latitude: roundCoordinate(meanLat),
    longitude: roundCoordinate(meanLon),
  }
}

function clusterRadiusFromQuery(query) {
  const radius = Number(query?.center?.radiusMeters)
  if (!Number.isFinite(radius) || radius <= 0) return 500
  return Math.min(Math.max(Math.round(radius / 3), 250), 700)
}

function createHotspots(points, query) {
  const clusterRadius = clusterRadiusFromQuery(query)
  const remaining = new Set(points.map((_, index) => index))
  const clusters = []

  while (remaining.size > 0) {
    let bestSeed = [...remaining][0]
    let bestMembers = []

    for (const seedIndex of remaining) {
      const seed = points[seedIndex]
      const members = [...remaining].filter((candidateIndex) => {
        const candidate = points[candidateIndex]
        return haversineDistanceMeters(seed, candidate) <= clusterRadius
      })

      if (members.length > bestMembers.length) {
        bestSeed = seedIndex
        bestMembers = members
      }
    }

    const members = bestMembers.length ? bestMembers : [bestSeed]
    members.forEach((index) => remaining.delete(index))
    clusters.push(members.map((index) => points[index]))
  }

  return clusters
    .map((members) => {
      const avgScore = average(members.map((business) => business.viability?.icp_score ?? 0))
      const center = centroid(members)
      const topBusinesses = [...members]
        .sort((a, b) => (b.viability?.icp_score ?? 0) - (a.viability?.icp_score ?? 0))
        .slice(0, 5)
        .map((business) => ({
          name: business.name,
          icp_score: business.viability?.icp_score ?? 0,
          status: business.status ?? 'unknown',
          source: business.source ?? 'unknown',
        }))
      const dominantZone = topItem(members.map((business) => business.zone)) || query?.zone || ''
      const dominantCategory = topItem(members.map((business) => business.category)) || query?.category || ''

      return {
        center,
        radius_meters: clusterRadius,
        business_count: members.length,
        avg_icp_score: avgScore,
        dominant_zone: dominantZone,
        dominant_category: dominantCategory,
        top_businesses: topBusinesses,
        opportunity: `${members.length} comercios de ${dominantCategory || 'interés'} concentrados${
          dominantZone ? ` en ${dominantZone}` : ''
        }, con score ICP promedio de ${avgScore}.`,
      }
    })
    .sort((a, b) => b.business_count - a.business_count || b.avg_icp_score - a.avg_icp_score)
    .map((hotspot, index) => ({
      rank: index + 1,
      label: `Hotspot ${index + 1}${hotspot.dominant_zone ? ` - ${hotspot.dominant_zone}` : ''}`,
      ...hotspot,
    }))
}

export function buildLocationSummary(scoredBusinesses, locationContext = {}) {
  const query = locationContext.query ?? {}
  const stats = locationContext.stats ?? {}
  const withCoordinates = scoredBusinesses.filter(
    (business) => Number.isFinite(business.latitude) && Number.isFinite(business.longitude),
  )
  const hotspots = createHotspots(withCoordinates, query)
  const center =
    query.center?.latitude && query.center?.longitude
      ? {
          latitude: Number(query.center.latitude),
          longitude: Number(query.center.longitude),
          radiusMeters: Number(query.center.radiusMeters) || 0,
        }
      : centroid(withCoordinates)

  return {
    query: {
      category: query.category ?? '',
      zone: query.zone ?? '',
      city: query.city ?? '',
      country: query.country ?? '',
      center,
    },
    stats: {
      existingReceived: Number(stats.existingReceived ?? 0),
      placesFound: Number(stats.placesFound ?? 0),
      dedupedAgainstExisting: Number(stats.dedupedAgainstExisting ?? 0),
      newlyDiscovered: Number(stats.newlyDiscovered ?? 0),
      facadeDescribed: Number(stats.facadeDescribed ?? 0),
      facadeSkipped: Number(stats.facadeSkipped ?? 0),
    },
    coordinate_coverage: {
      total_businesses: scoredBusinesses.length,
      with_coordinates: withCoordinates.length,
      coverage_ratio: scoredBusinesses.length ? round2(withCoordinates.length / scoredBusinesses.length) : 0,
    },
    coordinate_bounds: coordinateBounds(withCoordinates),
    hotspots: hotspots.slice(0, 5),
  }
}
