import { normalize } from './benchmarks.js'
import { estimateMetrics } from './formulas.js'

const STOP_WORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'y', 'o', 'u', 'en', 'para', 'por', 'con',
  'a', 'al', 'del', 'un', 'una', 'unos', 'unas', 'que', 'como', 'sus', 'su',
  'b2b', 'b2c', 'servicios', 'servicio', 'sector', 'industria', 'sas', 'saas',
])

function tokens(text) {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t && t.length > 2 && !STOP_WORDS.has(t))
}

function hasAnySocial(business) {
  const sm = business.social_media || {}
  return Boolean(
    business.instagram || business.facebook || business.linkedin || business.tiktok ||
      sm.instagram || sm.facebook || sm.linkedin || sm.tiktok
  )
}

function sizeScore(business) {
  const reviews = business.reviews_count ?? business.ratings_count ?? 0

  /** Umbrales ajustados al mercado LATAM donde 50+ reseñas ya indica negocio establecido. */
  let score
  if (reviews >= 200) score = 20
  else if (reviews >= 50) score = 14
  else if (reviews >= 15) score = 7
  else score = 2

  if (business.verified === true) score += 2
  if ((business.price_level ?? 0) >= 3) score += 3
  if ((business.photos_count ?? 0) > 10) score += 1

  /** Fachada descrita por IA = negocio encontrable y con identidad visual. */
  if (business.notes && typeof business.notes === 'string' && business.notes.length > 20) score += 2

  /** Google Maps URL presente = indexado correctamente. */
  if (business.google_maps_url) score += 1

  if (business.facade && Array.isArray(business.facade.features) && business.facade.features.length >= 5) {
    score += 1
  }

  return Math.max(0, Math.min(25, score))
}

function intentScore(business) {
  let score
  const r = business.rating
  if (r === null || r === undefined) score = 5
  else if (r >= 4.5) score = 12
  else if (r >= 4.0) score = 9
  else if (r >= 3.5) score = 6
  else score = 3

  if (business.website) score += 5
  if (hasAnySocial(business)) score += 3
  if (business.hours) score += 2
  if (business.email) score += 3

  if (business.whatsapp && !business.email) score += 1
  if (business.google_maps_url) score += 1

  /** Fachada descrita por visión IA = presencia física real y verificable. */
  if (business.notes && typeof business.notes === 'string' && business.notes.length > 20) score += 2

  return Math.max(0, Math.min(25, score))
}

function fitScore(business, productContext) {
  const targetTokens = tokens(productContext.target_industry)
  const catNorm = normalize(business.category)
  const subNorm = normalize(business.subcategory)
  const haystack = `${catNorm} ${subNorm}`.trim()

  if (!targetTokens.length || !haystack) return 5

  const targetFull = normalize(productContext.target_industry)
  if (catNorm && (targetFull === catNorm || targetFull.includes(catNorm) || catNorm.includes(targetFull))) {
    /**
     * Hay match de categoría pero todos los negocios comparten la misma, así que
     * diferenciamos dentro del rango 15–25 usando señales secundarias reales.
     */
    let fitBonus = 15
    /** Fachada descrita por visión = negocio con identidad visual clara. */
    if (business.notes && typeof business.notes === 'string' && business.notes.length > 20) fitBonus += 4
    /** Reseñas suficientes = negocio activo con clientes. */
    const reviews = business.reviews_count ?? business.ratings_count ?? 0
    if (reviews >= 50) fitBonus += 3
    else if (reviews >= 15) fitBonus += 2
    /** Rating alto = calidad percibida alta. */
    const r = business.rating
    if (r >= 4.7) fitBonus += 3
    else if (r >= 4.3) fitBonus += 2
    else if (r >= 4.0) fitBonus += 1
    return Math.min(25, fitBonus)
  }

  let matches = 0
  for (const t of targetTokens) {
    if (haystack.includes(t)) matches++
  }

  const ratio = matches / targetTokens.length
  if (ratio >= 0.7) return 22
  if (ratio >= 0.4) return Math.round(14 + (ratio - 0.4) * 23)
  if (ratio > 0) return Math.round(6 + ratio * 17)

  const RELATED = {
    agencia: ['marketing', 'consultor', 'publicidad', 'creativ'],
    marketing: ['agencia', 'publicidad', 'creativ', 'comunicacion'],
    salud: ['clinica', 'medico', 'odontolog', 'estetica', 'bienestar'],
    clinica: ['salud', 'medico', 'odontolog', 'estetica'],
    restaurante: ['cafe', 'bar', 'comida', 'gastronom'],
    tecnologia: ['software', 'sistemas', 'desarrollo', 'it', 'startup'],
    educacion: ['academia', 'instituto', 'colegio', 'universidad', 'curso'],
    inmobiliaria: ['bienes', 'raices', 'propiedad', 'construccion'],
    barberia: ['peluqueria', 'barber', 'estetica', 'estilist'],
    peluqueria: ['barberia', 'estetica', 'estilist'],
  }

  for (const t of targetTokens) {
    const related = RELATED[t] || []
    for (const r of related) {
      if (haystack.includes(r)) return 12
    }
  }

  return 3
}

function financialScore(ltvCacRatio) {
  if (ltvCacRatio >= 10) return 25
  if (ltvCacRatio >= 7) return 20
  if (ltvCacRatio >= 5) return 18
  if (ltvCacRatio >= 3) return 12
  if (ltvCacRatio >= 1) return 6
  return 0
}

export function scoreBusiness(business, productContext) {
  const size = sizeScore(business)
  const intent = intentScore(business)
  const fit = fitScore(business, productContext)

  const provisional = estimateMetrics(business, size)
  const financial = financialScore(provisional.ltv_cac_ratio)

  let total = size + intent + fit + financial
  if (total > 100) total = 100
  if (total < 0) total = 0

  let priority = 'LOW'
  let viable = false
  if (total >= 70) {
    priority = 'HIGH'
    viable = true
  } else if (total >= 45) {
    priority = 'MID'
    viable = true
  } else if (total >= 40) {
    priority = 'LOW'
    viable = true
  }

  return {
    ...business,
    viability: {
      icp_score: total,
      priority,
      viable,
      score_breakdown: {
        size_score: size,
        intent_score: intent,
        fit_score: fit,
        financial_score: financial,
      },
    },
  }
}

export function scoreAll(businesses, productContext) {
  return businesses.map((b) => scoreBusiness(b, productContext))
}
