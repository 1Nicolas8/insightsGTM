export const BENCHMARKS = {
  // Gastronomía
  restaurante:          { acv_min: 150, acv_max: 400, acl_min: 6,  acl_max: 12, cac_min: 80,  cac_max: 200 },
  café:                 { acv_min: 100, acv_max: 300, acl_min: 6,  acl_max: 12, cac_min: 60,  cac_max: 180 },
  cafeteria:            { acv_min: 100, acv_max: 300, acl_min: 6,  acl_max: 12, cac_min: 60,  cac_max: 180 },
  panaderia:            { acv_min: 80,  acv_max: 250, acl_min: 6,  acl_max: 12, cac_min: 50,  cac_max: 150 },
  bar:                  { acv_min: 120, acv_max: 350, acl_min: 6,  acl_max: 12, cac_min: 70,  cac_max: 200 },

  // Salud y bienestar
  clínica:              { acv_min: 300, acv_max: 800, acl_min: 18, acl_max: 36, cac_min: 150, cac_max: 400 },
  clinica:              { acv_min: 300, acv_max: 800, acl_min: 18, acl_max: 36, cac_min: 150, cac_max: 400 },
  salud:                { acv_min: 300, acv_max: 800, acl_min: 18, acl_max: 36, cac_min: 150, cac_max: 400 },
  odontologia:          { acv_min: 200, acv_max: 700, acl_min: 12, acl_max: 30, cac_min: 100, cac_max: 350 },
  veterinaria:          { acv_min: 150, acv_max: 500, acl_min: 12, acl_max: 24, cac_min: 80,  cac_max: 250 },
  farmacia:             { acv_min: 100, acv_max: 300, acl_min: 6,  acl_max: 12, cac_min: 60,  cac_max: 180 },
  drogueria:            { acv_min: 100, acv_max: 300, acl_min: 6,  acl_max: 12, cac_min: 60,  cac_max: 180 },
  gimnasio:             { acv_min: 200, acv_max: 500, acl_min: 12, acl_max: 24, cac_min: 100, cac_max: 250 },
  bienestar:            { acv_min: 200, acv_max: 500, acl_min: 12, acl_max: 24, cac_min: 100, cac_max: 250 },

  // Belleza y cuidado personal
  barbería:             { acv_min: 60,  acv_max: 250, acl_min: 12, acl_max: 36, cac_min: 40,  cac_max: 180 },
  barberia:             { acv_min: 60,  acv_max: 250, acl_min: 12, acl_max: 36, cac_min: 40,  cac_max: 180 },
  barber:               { acv_min: 60,  acv_max: 250, acl_min: 12, acl_max: 36, cac_min: 40,  cac_max: 180 },
  peluquería:           { acv_min: 60,  acv_max: 250, acl_min: 12, acl_max: 36, cac_min: 40,  cac_max: 180 },
  peluqueria:           { acv_min: 60,  acv_max: 250, acl_min: 12, acl_max: 36, cac_min: 40,  cac_max: 180 },
  estética:             { acv_min: 100, acv_max: 350, acl_min: 12, acl_max: 30, cac_min: 60,  cac_max: 220 },
  estetica:             { acv_min: 100, acv_max: 350, acl_min: 12, acl_max: 30, cac_min: 60,  cac_max: 220 },
  spa:                  { acv_min: 150, acv_max: 450, acl_min: 12, acl_max: 30, cac_min: 80,  cac_max: 250 },

  // Servicios profesionales
  agencia:              { acv_min: 500, acv_max: 2000, acl_min: 12, acl_max: 24, cac_min: 200, cac_max: 600 },
  marketing:            { acv_min: 500, acv_max: 2000, acl_min: 12, acl_max: 24, cac_min: 200, cac_max: 600 },
  jurídico:             { acv_min: 400, acv_max: 1200, acl_min: 24, acl_max: 48, cac_min: 200, cac_max: 500 },
  juridico:             { acv_min: 400, acv_max: 1200, acl_min: 24, acl_max: 48, cac_min: 200, cac_max: 500 },
  contable:             { acv_min: 300, acv_max: 900,  acl_min: 24, acl_max: 48, cac_min: 150, cac_max: 450 },
  tecnología:           { acv_min: 400, acv_max: 2000, acl_min: 12, acl_max: 36, cac_min: 200, cac_max: 700 },
  tecnologia:           { acv_min: 400, acv_max: 2000, acl_min: 12, acl_max: 36, cac_min: 200, cac_max: 700 },

  // Educación
  educación:            { acv_min: 250, acv_max: 700, acl_min: 12, acl_max: 36, cac_min: 150, cac_max: 400 },
  educacion:            { acv_min: 250, acv_max: 700, acl_min: 12, acl_max: 36, cac_min: 150, cac_max: 400 },
  academia:             { acv_min: 250, acv_max: 700, acl_min: 12, acl_max: 36, cac_min: 150, cac_max: 400 },
  colegio:              { acv_min: 300, acv_max: 900, acl_min: 24, acl_max: 48, cac_min: 150, cac_max: 450 },

  // Retail y comercio
  retail:               { acv_min: 200, acv_max: 600, acl_min: 8,  acl_max: 18, cac_min: 100, cac_max: 300 },
  tienda:               { acv_min: 200, acv_max: 600, acl_min: 8,  acl_max: 18, cac_min: 100, cac_max: 300 },
  supermercado:         { acv_min: 300, acv_max: 800, acl_min: 6,  acl_max: 12, cac_min: 150, cac_max: 400 },
  ferreteria:           { acv_min: 150, acv_max: 500, acl_min: 6,  acl_max: 18, cac_min: 80,  cac_max: 300 },

  // Inmobiliario y construcción
  inmobiliaria:         { acv_min: 400, acv_max: 1500, acl_min: 6,  acl_max: 18, cac_min: 200, cac_max: 800 },
  construcción:         { acv_min: 600, acv_max: 3000, acl_min: 6,  acl_max: 18, cac_min: 300, cac_max: 1000 },
  construccion:         { acv_min: 600, acv_max: 3000, acl_min: 6,  acl_max: 18, cac_min: 300, cac_max: 1000 },
  'conjunto residencial': { acv_min: 250, acv_max: 800, acl_min: 12, acl_max: 36, cac_min: 150, cac_max: 500 },
  residencial:          { acv_min: 250, acv_max: 800, acl_min: 12, acl_max: 36, cac_min: 150, cac_max: 500 },

  // Hospitalidad
  hotel:                { acv_min: 500, acv_max: 2000, acl_min: 12, acl_max: 24, cac_min: 300, cac_max: 700 },
  hospedaje:            { acv_min: 300, acv_max: 1000, acl_min: 6,  acl_max: 18, cac_min: 200, cac_max: 500 },
  hostal:               { acv_min: 150, acv_max: 500,  acl_min: 6,  acl_max: 12, cac_min: 100, cac_max: 300 },

  // Automotriz
  taller:               { acv_min: 200, acv_max: 700, acl_min: 12, acl_max: 24, cac_min: 100, cac_max: 350 },
  lavadero:             { acv_min: 80,  acv_max: 250, acl_min: 6,  acl_max: 12, cac_min: 50,  cac_max: 150 },

  default:              { acv_min: 180, acv_max: 450, acl_min: 10, acl_max: 18, cac_min: 120, cac_max: 320 },
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
