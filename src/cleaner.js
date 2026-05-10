function safeString(value) {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
  if (!str) return null
  return str.replace(/[\u0000-\u001F\u007F]+/g, '').replace(/\s+/g, ' ').trim() || null
}

function toFloat(value) {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function toInt(value) {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? Math.round(value) : parseInt(String(value).replace(/[^\d-]/g, ''), 10)
  return Number.isFinite(n) ? n : null
}

function toBool(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  const s = String(value).trim().toLowerCase()
  if (s === 'true' || s === '1' || s === 'yes' || s === 'si' || s === 'sí') return true
  if (s === 'false' || s === '0' || s === 'no') return false
  return null
}

function normalizePhone(value) {
  const s = safeString(value)
  if (!s) return null
  const cleaned = s.replace(/[\s\-().]+/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned || null
}

function normalizeWebsite(value) {
  const s = safeString(value)
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  if (/^[\w-]+\.[\w.-]+/.test(s)) return `https://${s}`
  return null
}

function parseFacade(notes) {
  if (!notes || typeof notes !== 'string') return { description: null, features: [] }
  const trimmed = notes.trim()
  if (!trimmed) return { description: null, features: [] }
  const idx = trimmed.toLowerCase().indexOf('| features:')
  if (idx === -1) return { description: trimmed, features: [] }
  const description = trimmed.slice(0, idx).trim() || null
  const featuresPart = trimmed.slice(idx + '| features:'.length)
  const features = featuresPart
    .split(/[;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  return { description, features }
}

export function cleanBusiness(business) {
  if (!business || typeof business !== 'object') return null

  const legacySocial = business.social_media || {}
  const instagram = safeString(business.instagram ?? legacySocial.instagram)
  const facebook = safeString(business.facebook ?? legacySocial.facebook)
  const linkedin = safeString(business.linkedin ?? legacySocial.linkedin)
  const tiktok = safeString(business.tiktok ?? legacySocial.tiktok)

  const ratingsCount = toInt(business.ratings_count ?? business.reviews_count)
  const facade = parseFacade(business.notes)

  const cleaned = {
    name: safeString(business.name),
    category: safeString(business.category),
    subcategory: safeString(business.subcategory),
    zone: safeString(business.zone),
    city: safeString(business.city),
    country: safeString(business.country),
    address: safeString(business.address),
    latitude: toFloat(business.latitude),
    longitude: toFloat(business.longitude),
    phone: normalizePhone(business.phone),
    whatsapp: normalizePhone(business.whatsapp),
    email: safeString(business.email),
    website: normalizeWebsite(business.website),
    instagram,
    facebook,
    linkedin,
    tiktok,
    google_place_id: safeString(business.google_place_id),
    google_maps_url: safeString(business.google_maps_url),
    rating: toFloat(business.rating),
    ratings_count: ratingsCount,
    reviews_count: ratingsCount,
    price_level: toInt(business.price_level),
    photos_count: toInt(business.photos_count),
    hours: safeString(business.hours),
    verified: toBool(business.verified),
    source: safeString(business.source),
    status: safeString(business.status),
    notes: safeString(business.notes),
    facade,
    social_media: { instagram, facebook, linkedin, tiktok },
  }

  if (cleaned.rating !== null) {
    if (cleaned.rating < 0) cleaned.rating = 0
    if (cleaned.rating > 5) cleaned.rating = 5
    cleaned.rating = Math.round(cleaned.rating * 10) / 10
  }

  if (cleaned.price_level !== null) {
    if (cleaned.price_level < 1) cleaned.price_level = 1
    if (cleaned.price_level > 4) cleaned.price_level = 4
  }

  return cleaned
}

export function cleanAll(businesses) {
  if (!Array.isArray(businesses)) return []
  return businesses
    .map((b) => {
      try {
        return cleanBusiness(b)
      } catch {
        return null
      }
    })
    .filter((b) => b && b.name && b.category)
}
