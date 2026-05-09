function digitalPresenceScore(business) {
  let score = 0
  if (business.website) score += 3
  const sm = business.social_media || {}
  if (sm.instagram || sm.facebook || sm.linkedin) score += 2
  if ((business.photos_count ?? 0) > 10) score += 2
  if (business.email) score += 2
  if (business.verified === true) score += 1
  return Math.max(0, Math.min(10, score))
}

function estimateSize(business) {
  const reviews = business.reviews_count ?? 0
  if (reviews >= 500 || business.price_level === 4) return 'LARGE'
  if (reviews >= 100) return 'MID'
  if (reviews >= 20) return 'SMALL'
  return 'MICRO'
}

function metricConfidence(business) {
  let count = 0
  if (business.rating !== null && business.rating !== undefined) count++
  if (business.reviews_count !== null && business.reviews_count !== undefined) count++
  if (business.website) count++
  if (count === 3) return 'HIGH'
  if (count === 2) return 'MED'
  return 'LOW'
}

function reasonFor(score) {
  if (score < 20) return 'Score muy bajo: negocio con poca presencia y bajo fit con el producto'
  if (score < 30) return 'Fit insuficiente con el perfil de cliente ideal'
  return 'Potencial limitado: ratio LTV/CAC no justifica el esfuerzo de adquisición'
}

function ensureOpeningLineHasName(opening, businessName, fallback) {
  if (typeof opening !== 'string' || !opening.trim()) return fallback
  const lower = opening.toLowerCase()
  if (lower.includes(businessName.toLowerCase())) return opening
  return `${opening.replace(/\.$/, '')}. (sobre ${businessName})`
}

function topCategories(businesses, n = 3) {
  const counts = new Map()
  for (const b of businesses) {
    const c = (b.category || '').trim()
    if (!c) continue
    counts.set(c, (counts.get(c) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([c]) => c)
}

function avg(arr) {
  if (!arr.length) return 0
  const sum = arr.reduce((a, b) => a + (Number(b) || 0), 0)
  return Math.round(sum / arr.length)
}

function avg2(arr) {
  if (!arr.length) return 0
  const sum = arr.reduce((a, b) => a + (Number(b) || 0), 0)
  return Math.round((sum / arr.length) * 100) / 100
}

function describeOpportunity({ viableCount, totalCount, topCats, avgLtv }) {
  if (!totalCount) return 'No se procesaron negocios para evaluar la oportunidad de mercado.'
  if (!viableCount) {
    return `Se analizaron ${totalCount} negocios pero ninguno alcanza el umbral de viabilidad para este producto.`
  }
  const pct = Math.round((viableCount / totalCount) * 100)
  const topStr = topCats.length ? topCats.slice(0, 2).join(' y ') : 'múltiples categorías'
  return `Mercado con ${viableCount} prospectos viables de ${totalCount} analizados (${pct}%), concentrados en ${topStr}, con un LTV promedio estimado de USD ${avgLtv}.`
}

function recommendedApproach(top, viables) {
  const pool = top.length ? top : viables.slice(0, 10)
  if (!pool.length) return 'cold_call'
  const counts = new Map()
  for (const b of pool) {
    const ch = b.tone_data?.channel || 'cold_call'
    counts.set(ch, (counts.get(ch) || 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

export function buildReport(cleanedBusinesses, scoredBusinesses, aiInsights, productContext) {
  const insightByName = new Map()
  for (const ins of aiInsights || []) {
    if (ins?.business_name) insightByName.set(ins.business_name.toLowerCase(), ins)
  }

  let viables = scoredBusinesses
    .filter((b) => b.viability.viable)
    .sort((a, b) => b.viability.icp_score - a.viability.icp_score)

  if (viables.length < 3 && scoredBusinesses.length > viables.length) {
    const need = Math.min(3, scoredBusinesses.length) - viables.length
    const extras = scoredBusinesses
      .filter((b) => !b.viability.viable)
      .sort((a, b) => b.viability.icp_score - a.viability.icp_score)
      .slice(0, need)
      .map((b) => ({ ...b, viability: { ...b.viability, viable: true } }))
    viables = [...viables, ...extras]
  }

  const ranked = viables.map((b, idx) => {
    const fallback = {
      business_name: b.name,
      pain_points: [
        `Gestión operativa del negocio en ${b.category}`,
        'Captación y retención de clientes',
        'Optimización de procesos comerciales',
      ],
      growth_signals: [],
      risk_flags: [],
      why_viable: `${b.name} encaja con ${productContext.name} por su perfil en ${b.category}.`,
      opening_line: `Hola, vi el perfil de ${b.name}${b.rating ? ` con calificación ${b.rating}` : ''} y quería compartir algo que puede ayudarles.`,
      talk_track: [
        'Abrir con observación específica del negocio',
        'Identificar el dolor principal',
        `Presentar cómo ${productContext.name} resuelve ese problema`,
      ],
      commercial_foundation: {
        trust_signal: `Experiencia en ${b.category}`,
        common_ground: `Retos del sector ${b.category}`,
        personalized_value_prop: productContext.value_proposition,
        objection_prep: 'Si dicen que no tienen presupuesto: enfocarse en el ROI',
      },
    }
    const ins = insightByName.get(b.name.toLowerCase()) || fallback

    const acv = b.marketing_metrics.estimated_acv_usd
    const acl = b.marketing_metrics.estimated_acl_months
    const ltv = Math.round(acv * acl)
    const marketingMetrics = {
      ...b.marketing_metrics,
      estimated_ltv_usd: ltv,
      ltv_cac_ratio:
        b.marketing_metrics.estimated_cac_usd > 0
          ? Math.round((ltv / b.marketing_metrics.estimated_cac_usd) * 100) / 100
          : 0,
      metric_confidence: metricConfidence(b),
    }

    const opening = ensureOpeningLineHasName(ins.opening_line, b.name, fallback.opening_line)

    return {
      rank: idx + 1,
      business_name: b.name,
      category: b.category,
      contact: {
        phone: b.phone,
        email: b.email,
        website: b.website,
      },
      viability: {
        icp_score: b.viability.icp_score,
        priority: b.viability.priority,
        viable: true,
        score_breakdown: b.viability.score_breakdown,
      },
      marketing_metrics: marketingMetrics,
      business_intelligence: {
        estimated_size: estimateSize(b),
        digital_presence_score: digitalPresenceScore(b),
        pain_points: ins.pain_points || fallback.pain_points,
        growth_signals: ins.growth_signals || fallback.growth_signals,
        risk_flags: ins.risk_flags || fallback.risk_flags,
        why_viable: ins.why_viable || fallback.why_viable,
      },
      commercial_approach: {
        recommended_channel: b.tone_data?.channel || 'cold_call',
        conversation_tone: b.tone_data?.tone || 'consultivo',
        best_contact_time: b.tone_data?.best_time || 'Martes y jueves, 10am–12pm y 3pm–5pm',
        opening_line: opening,
        talk_track: ins.talk_track || fallback.talk_track,
        commercial_foundation: ins.commercial_foundation || fallback.commercial_foundation,
      },
    }
  })

  const viableNamesLower = new Set(ranked.map((r) => r.business_name.toLowerCase()))
  const nonViable = scoredBusinesses
    .filter((b) => !viableNamesLower.has(b.name.toLowerCase()))
    .sort((a, b) => b.viability.icp_score - a.viability.icp_score)
    .map((b) => ({
      business_name: b.name,
      icp_score: b.viability.icp_score,
      reason: reasonFor(b.viability.icp_score),
    }))

  const allScores = scoredBusinesses.map((b) => b.viability.icp_score)
  const viableLtvs = ranked.map((r) => r.marketing_metrics.estimated_ltv_usd)
  const viableCacs = ranked.map((r) => r.marketing_metrics.estimated_cac_usd)
  const cats = topCategories(cleanedBusinesses, 3)

  const market = {
    total_addressable_leads: ranked.length,
    avg_icp_score: avg2(allScores),
    avg_estimated_ltv: avg(viableLtvs),
    avg_estimated_cac: avg(viableCacs),
    market_opportunity: describeOpportunity({
      viableCount: ranked.length,
      totalCount: scoredBusinesses.length,
      topCats: cats,
      avgLtv: avg(viableLtvs),
    }),
    top_categories: cats,
    recommended_approach: recommendedApproach(scoredBusinesses.slice(0, 10), ranked),
  }

  return {
    metadata: {
      total_processed: scoredBusinesses.length,
      viable_count: ranked.length,
      processing_timestamp: new Date().toISOString(),
      product_context_used: `${productContext.name} — ${productContext.description}`,
    },
    market_summary: market,
    ranked_prospects: ranked,
    non_viable: nonViable,
  }
}
