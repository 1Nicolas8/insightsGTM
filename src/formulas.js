import { getBenchmark } from './benchmarks.js'

function round2(n) {
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

function safeDiv(num, den) {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return 0
  return num / den
}

export function calcLTV(acv, acl) {
  return round2((Number(acv) || 0) * (Number(acl) || 0))
}

export function calcCAC(totalSpend, clients) {
  return round2(safeDiv(totalSpend, clients))
}

export function calcROAS(revenue, adSpend) {
  return round2(safeDiv(revenue, adSpend))
}

export function calcROI(revenue, investment) {
  if (!Number.isFinite(investment) || investment === 0) return 0
  return round2((revenue - investment) / investment)
}

export function calcCPR(totalSpent, results) {
  return round2(safeDiv(totalSpent, results))
}

export function calcACV(revenue, purchases, clients) {
  const ticket = safeDiv(revenue, purchases)
  const freq = safeDiv(purchases, clients)
  return round2(ticket * freq)
}

export function calcLTVCACRatio(ltv, cac) {
  return round2(safeDiv(ltv, cac))
}

export function estimateMetrics(business, sizeScore) {
  const benchmark = getBenchmark(business.category)

  const clamped = Math.max(0, Math.min(25, Number(sizeScore) || 0))
  const factor = clamped / 25

  const acvRaw = benchmark.acv_min + (benchmark.acv_max - benchmark.acv_min) * factor
  const aclRaw = benchmark.acl_min + (benchmark.acl_max - benchmark.acl_min) * factor
  const cacRaw = benchmark.cac_min + (benchmark.cac_max - benchmark.cac_min) * factor

  const acv = Math.round(acvRaw)
  const acl = Math.round(aclRaw)
  const cac = Math.round(cacRaw)

  const ltv = Math.round(calcLTV(acv, acl))
  const ltv_cac_ratio = calcLTVCACRatio(ltv, cac)
  const roas = calcROAS(ltv, cac)
  const roi = calcROI(ltv, cac)
  const cpr = Math.round(safeDiv(cac, 10))

  return {
    estimated_acv_usd: acv,
    estimated_acl_months: acl,
    estimated_ltv_usd: ltv,
    estimated_cac_usd: cac,
    ltv_cac_ratio,
    projected_roas: roas,
    estimated_roi: roi,
    cpr_estimate: cpr,
  }
}
