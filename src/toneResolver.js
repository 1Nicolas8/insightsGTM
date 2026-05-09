import { normalize } from './benchmarks.js'

const BEST_TIME = {
  formal: 'Martes a jueves, 9am–11am',
  directo: 'Lunes a miércoles, 10am–12pm',
  consultivo: 'Martes y jueves, 10am–12pm y 3pm–5pm',
  cercano: 'Lunes a viernes, 11am–1pm',
  educativo: 'Miércoles y viernes, 9am–11am',
}

function detectTone(business, icp_score) {
  const cat = `${normalize(business.category)} ${normalize(business.subcategory)}`

  const formalKeys = ['juridico', 'legal', 'contable', 'contador', 'financiero', 'finanzas', 'salud', 'clinica', 'medico', 'hospital']
  const directKeys = ['agencia', 'marketing', 'consultor', 'tecnologia', 'software', 'startup']
  const educationKeys = ['educacion', 'academia', 'instituto', 'colegio', 'universidad']

  if (formalKeys.some((k) => cat.includes(k))) return 'formal'
  if (directKeys.some((k) => cat.includes(k))) return 'directo'
  if (educationKeys.some((k) => cat.includes(k))) return 'educativo'

  if (icp_score >= 70 && business.website) return 'consultivo'

  const sizeScore = business.viability?.score_breakdown?.size_score
  if ((typeof sizeScore === 'number' && sizeScore <= 8) || !business.website) return 'cercano'

  return 'consultivo'
}

function isColombianPhone(phone) {
  if (!phone) return false
  const digits = String(phone).replace(/\D/g, '')
  if (digits.startsWith('57') && digits.length >= 12) return true
  if (digits.length === 10 && digits.startsWith('3')) return true
  return false
}

function detectChannel(business, tone) {
  const social = business.social_media || {}

  if (social.linkedin) return 'linkedin'
  if (business.email && (tone === 'formal' || tone === 'directo')) return 'email'
  if (business.phone) {
    if (isColombianPhone(business.phone) && (tone === 'cercano' || tone === 'educativo')) {
      return 'whatsapp'
    }
    return 'cold_call'
  }
  if (isColombianPhone(business.phone)) return 'whatsapp'
  if (!business.phone && !business.email && !social.linkedin) return 'presencial'
  return 'presencial'
}

export function resolveTone(business, icp_score) {
  const tone = detectTone(business, icp_score)
  const channel = detectChannel(business, tone)
  const best_time = BEST_TIME[tone] || BEST_TIME.consultivo
  return { tone, channel, best_time }
}
