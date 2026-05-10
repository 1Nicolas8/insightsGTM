import { cleanAll } from './cleaner.js'
import { scoreAll } from './scorer.js'
import { estimateMetrics } from './formulas.js'
import { resolveTone } from './toneResolver.js'
import { generateInsights } from './aiInsights.js'
import { buildReport } from './reportBuilder.js'

function extractProductName(desc) {
  if (!desc) return 'Producto'
  const text = String(desc).split(/[.\n]/)[0].trim()
  if (!text) return 'Producto'
  const tokens = text.split(/\s+/)
  const cutAt = tokens.findIndex((t, i) => i > 0 && /^(que|para|con|de|en|y)$/i.test(t))
  const taken = cutAt > 0 ? tokens.slice(0, cutAt) : tokens.slice(0, 4)
  if (cutAt > 0 && /^(para|de|con)$/i.test(tokens[cutAt]) && tokens[cutAt + 1]) {
    taken.push(tokens[cutAt], tokens[cutAt + 1])
  }
  return taken.join(' ').replace(/[,;:]+$/, '').trim() || 'Producto'
}

export function buildProductContext(input) {
  const pc = input.product_context || {}
  const locationBits = []
  if (input.zone) locationBits.push(input.zone)
  if (input.city) locationBits.push(input.city)
  const locStr = locationBits.length ? ` en ${locationBits.join(', ')}` : ''

  return {
    name: pc.name || extractProductName(input.icp_description),
    description: pc.description || input.icp_description || `Producto para ${input.category}`,
    target_industry: pc.target_industry || `${input.category}${locStr}`,
    price_range: pc.price_range || 'Por definir',
    value_proposition: pc.value_proposition || input.icp_description || `Solución específica para ${input.category}`,
  }
}

function inheritContext(business, input) {
  return {
    ...business,
    zone: business.zone ?? input.zone ?? null,
    city: business.city ?? input.city ?? null,
    country: business.country ?? input.country ?? null,
  }
}

export async function analyze(input) {
  const productContext = buildProductContext(input)
  const businessesRaw = Array.isArray(input.existing_businesses)
    ? input.existing_businesses
    : Array.isArray(input.businesses)
    ? input.businesses
    : []

  const cleaned = cleanAll(businessesRaw).map((b) => inheritContext(b, input))

  const queryContext = {
    category: input.category ?? null,
    zone: input.zone ?? null,
    city: input.city ?? null,
    country: input.country ?? null,
    icp_description: input.icp_description ?? null,
    query: input.query ?? null,
    stats: input.stats ?? null,
  }

  if (!cleaned.length) {
    return buildReport(cleaned, [], [], productContext, queryContext)
  }

  const scored = scoreAll(cleaned, productContext)

  const withMetrics = scored.map((b) => ({
    ...b,
    marketing_metrics: estimateMetrics(b, b.viability.score_breakdown.size_score),
  }))

  const withTone = withMetrics.map((b) => ({
    ...b,
    tone_data: resolveTone(b, b.viability.icp_score),
  }))

  const viables = withTone
    .filter((b) => b.viability.viable)
    .sort((a, b) => b.viability.icp_score - a.viability.icp_score)
    .slice(0, 20)

  const insights = await generateInsights(viables, productContext)

  return buildReport(cleaned, withTone, insights, productContext, queryContext)
}
