export const BENCHMARKS = {
  restaurante: { acv_min: 150, acv_max: 400, acl_min: 6, acl_max: 12, cac_min: 80, cac_max: 200 },
  café: { acv_min: 100, acv_max: 300, acl_min: 6, acl_max: 12, cac_min: 60, cac_max: 180 },
  clínica: { acv_min: 300, acv_max: 800, acl_min: 18, acl_max: 36, cac_min: 150, cac_max: 400 },
  salud: { acv_min: 300, acv_max: 800, acl_min: 18, acl_max: 36, cac_min: 150, cac_max: 400 },
  agencia: { acv_min: 500, acv_max: 2000, acl_min: 12, acl_max: 24, cac_min: 200, cac_max: 600 },
  marketing: { acv_min: 500, acv_max: 2000, acl_min: 12, acl_max: 24, cac_min: 200, cac_max: 600 },
  retail: { acv_min: 200, acv_max: 600, acl_min: 8, acl_max: 18, cac_min: 100, cac_max: 300 },
  tienda: { acv_min: 200, acv_max: 600, acl_min: 8, acl_max: 18, cac_min: 100, cac_max: 300 },
  gimnasio: { acv_min: 200, acv_max: 500, acl_min: 12, acl_max: 24, cac_min: 100, cac_max: 250 },
  bienestar: { acv_min: 200, acv_max: 500, acl_min: 12, acl_max: 24, cac_min: 100, cac_max: 250 },
  educación: { acv_min: 250, acv_max: 700, acl_min: 12, acl_max: 36, cac_min: 150, cac_max: 400 },
  academia: { acv_min: 250, acv_max: 700, acl_min: 12, acl_max: 36, cac_min: 150, cac_max: 400 },
  inmobiliaria: { acv_min: 400, acv_max: 1500, acl_min: 6, acl_max: 18, cac_min: 200, cac_max: 800 },
  hotel: { acv_min: 500, acv_max: 2000, acl_min: 12, acl_max: 24, cac_min: 300, cac_max: 700 },
  hospedaje: { acv_min: 300, acv_max: 1000, acl_min: 6, acl_max: 18, cac_min: 200, cac_max: 500 },
  jurídico: { acv_min: 400, acv_max: 1200, acl_min: 24, acl_max: 48, cac_min: 200, cac_max: 500 },
  contable: { acv_min: 300, acv_max: 900, acl_min: 24, acl_max: 48, cac_min: 150, cac_max: 450 },
  construcción: { acv_min: 600, acv_max: 3000, acl_min: 6, acl_max: 18, cac_min: 300, cac_max: 1000 },
  tecnología: { acv_min: 400, acv_max: 2000, acl_min: 12, acl_max: 36, cac_min: 200, cac_max: 700 },
  default: { acv_min: 200, acv_max: 500, acl_min: 12, acl_max: 18, cac_min: 150, cac_max: 350 },
}

export function normalize(text) {
  if (!text) return ''
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

const KEY_INDEX = Object.keys(BENCHMARKS)
  .filter((k) => k !== 'default')
  .map((k) => ({ key: k, norm: normalize(k) }))

export function getBenchmark(category) {
  const cat = normalize(category)
  if (!cat) return BENCHMARKS.default

  for (const { key, norm } of KEY_INDEX) {
    if (cat === norm) return BENCHMARKS[key]
  }
  for (const { key, norm } of KEY_INDEX) {
    if (cat.includes(norm) || norm.includes(cat)) return BENCHMARKS[key]
  }
  return BENCHMARKS.default
}
