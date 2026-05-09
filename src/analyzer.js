import { cleanAll } from './cleaner.js'
import { scoreAll } from './scorer.js'
import { estimateMetrics } from './formulas.js'
import { resolveTone } from './toneResolver.js'
import { generateInsights } from './aiInsights.js'
import { buildReport } from './reportBuilder.js'

export async function analyze(input) {
  const cleaned = cleanAll(input.businesses)

  if (!cleaned.length) {
    return buildReport(cleaned, [], [], input.product_context)
  }

  const scored = scoreAll(cleaned, input.product_context)

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

  const insights = await generateInsights(viables, input.product_context)

  return buildReport(cleaned, withTone, insights, input.product_context)
}
