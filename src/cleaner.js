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

function normalizeSocial(social) {
  const base = { instagram: null, facebook: null, linkedin: null }
  if (!social || typeof social !== 'object') return base
  return {
    instagram: safeString(social.instagram),
    facebook: safeString(social.facebook),
    linkedin: safeString(social.linkedin),
  }
}

export function cleanBusiness(business) {
  if (!business || typeof business !== 'object') return null

  const cleaned = {
    name: safeString(business.name),
    category: safeString(business.category),
    subcategory: safeString(business.subcategory),
    address: safeString(business.address),
    city: safeString(business.city),
    country: safeString(business.country),
    phone: normalizePhone(business.phone),
    website: normalizeWebsite(business.website),
    email: safeString(business.email),
    rating: toFloat(business.rating),
    reviews_count: toInt(business.reviews_count),
    price_level: toInt(business.price_level),
    hours: safeString(business.hours),
    photos_count: toInt(business.photos_count),
    verified: toBool(business.verified),
    social_media: normalizeSocial(business.social_media),
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
