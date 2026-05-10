import OpenAI from 'openai'

let cachedClient = null

function getClient() {
  if (cachedClient) return cachedClient
  if (!process.env.DEEPSEEK_API_KEY) return null
  cachedClient = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
  })
  return cachedClient
}

function extractJSON(text) {
  if (typeof text !== 'string' || !text.trim()) return null
  try {
    return JSON.parse(text)
  } catch {}
  const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (mdMatch) {
    try {
      return JSON.parse(mdMatch[1].trim())
    } catch {}
  }
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0])
    } catch {}
  }
  return null
}

function truncate(str, max = 280) {
  if (!str) return null
  const s = String(str)
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}

function buildOpeningHook(business) {
  const bits = []
  if (business.zone) bits.push(`en ${business.zone}`)
  if (business.rating) bits.push(`con calificación ${business.rating}${business.ratings_count ? ` (${business.ratings_count} reseñas)` : ''}`)
  if (business.facade?.description) bits.push('cuya fachada llamó la atención')
  if (!bits.length && business.address) bits.push(`ubicada en ${business.address}`)
  return bits.join(', ')
}

function fallbackInsight(business, productContext) {
  const hook = buildOpeningHook(business)
  const featuresHint = business.facade?.features?.length
    ? business.facade.features.slice(0, 2).join(' y ')
    : null

  return {
    business_name: business.name,
    pain_points: [
      `Gestión operativa diaria de ${business.category}${business.zone ? ` en ${business.zone}` : ''}`,
      'Captación constante de clientes nuevos y manejo de citas / agenda',
      'Fidelización y aumento del ticket promedio por cliente',
    ],
    growth_signals:
      business.rating !== null && business.rating !== undefined && business.rating >= 4
        ? [`Alta valoración pública (${business.rating}${business.ratings_count ? ` con ${business.ratings_count} reseñas` : ''})`]
        : [],
    risk_flags: [],
    why_viable: (() => {
      const base = `${business.name} encaja con ${productContext.name} porque opera en ${business.category}${
        business.city ? ` en ${business.city}` : ''
      }`
      const vp = productContext.value_proposition
      if (!vp) return `${base} y se beneficia directamente de la propuesta de valor.`
      const vpClean = vp.replace(/^[\s.]+|[\s.]+$/g, '')
      return `${base}. ${vpClean.charAt(0).toUpperCase()}${vpClean.slice(1)}.`
    })(),
    opening_line: `Hola, vi a ${business.name}${hook ? ` ${hook}` : ''}${
      featuresHint ? ` (noté ${featuresHint.toLowerCase()})` : ''
    } y quería preguntarles cómo están manejando hoy la agenda y la fidelización de sus clientes.`,
    talk_track: [
      'Abrir mencionando un detalle concreto del local o de su presencia digital y hacer una pregunta abierta',
      'Explorar cómo gestionan citas, recordatorios y clientes recurrentes hoy',
      `Presentar cómo ${productContext.name} resuelve esos puntos específicos para negocios como el suyo`,
    ],
    commercial_foundation: {
      trust_signal: `Experiencia trabajando con negocios de ${business.category}${business.zone ? ` en zonas como ${business.zone}` : ''}`,
      common_ground: `Los retos diarios de operar un ${business.category} y mantener la agenda llena`,
      personalized_value_prop: productContext.value_proposition,
      objection_prep:
        'Si dicen que no tienen tiempo o presupuesto: enfocarse en cuánto pierden por citas no agendadas o clientes que no vuelven',
    },
  }
}

const SYSTEM_PROMPT = `Eres un experto en ventas B2B, marketing GTM y estrategia comercial.
Tu tarea es analizar prospectos de negocio y generar inteligencia comercial accionable y personalizada.
SIEMPRE responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown, sin explicaciones.
El JSON debe comenzar con { y terminar con }.`

function buildUserPrompt(leads, productContext) {
  const compact = leads.map((l) => ({
    name: l.name,
    category: l.category,
    subcategory: l.subcategory || undefined,
    zone: l.zone || undefined,
    city: l.city || undefined,
    address: l.address || undefined,
    rating: l.rating ?? undefined,
    reviews: l.reviews_count ?? l.ratings_count ?? undefined,
    website: l.website || undefined,
    instagram: l.instagram || undefined,
    facebook: l.facebook || undefined,
    tiktok: l.tiktok || undefined,
    whatsapp: l.whatsapp || undefined,
    phone: l.phone || undefined,
    icp_score: l.viability?.icp_score,
    facade: l.facade?.description ? truncate(l.facade.description, 240) : undefined,
    facade_features: l.facade?.features?.length ? l.facade.features.slice(0, 6) : undefined,
  }))

  return `PRODUCTO A VENDER:
Nombre: ${productContext.name}
Descripción: ${productContext.description}
Propuesta de valor: ${productContext.value_proposition}
Precio: ${productContext.price_range}
Cliente ideal: ${productContext.target_industry}

PROSPECTOS A ANALIZAR (ya ordenados por viabilidad — usa la fachada y features para personalizar el opening):
${JSON.stringify(compact, null, 2)}

Para cada prospecto genera un objeto JSON con esta estructura exacta:
{
  "insights": [
    {
      "business_name": "nombre exacto del negocio",
      "pain_points": ["dolor específico 1", "dolor específico 2", "dolor específico 3"],
      "growth_signals": ["señal positiva detectada"],
      "risk_flags": ["riesgo si existe, o array vacío"],
      "why_viable": "1-2 oraciones conectando este negocio con la propuesta de valor del producto",
      "opening_line": "primera frase para iniciar contacto — DEBE mencionar el nombre del negocio y un dato concreto (zona, rating, un detalle de la fachada, etc.)",
      "talk_track": [
        "Paso 1: cómo abrir la conversación y generar rapport",
        "Paso 2: cómo identificar el dolor principal",
        "Paso 3: cómo presentar el valor del producto"
      ],
      "commercial_foundation": {
        "trust_signal": "qué mencionar para generar credibilidad con este tipo de negocio",
        "common_ground": "punto de conexión con su realidad",
        "personalized_value_prop": "cómo presentar el producto específicamente para este prospecto",
        "objection_prep": "principal objeción probable y cómo manejarla"
      }
    }
  ]
}

REGLAS:
- El array insights debe tener exactamente ${leads.length} elementos
- El orden debe coincidir con el orden de los prospectos dados
- Los pain_points deben ser específicos a la categoría, zona y tamaño del negocio
- El opening_line DEBE mencionar el nombre del negocio y al menos un dato concreto (zona, rating, fachada, etc.)
- NO uses frases genéricas como "hola, me comunico para ofrecerle..."
- Si hay descripción de fachada, úsala para hacer el opening específico
- Responde SOLO el JSON, sin texto adicional`
}

function normalizeInsight(raw, fallback) {
  if (!raw || typeof raw !== 'object') return fallback
  return {
    business_name:
      typeof raw.business_name === 'string' && raw.business_name.trim()
        ? raw.business_name.trim()
        : fallback.business_name,
    pain_points:
      Array.isArray(raw.pain_points) && raw.pain_points.length
        ? raw.pain_points.map(String).slice(0, 5)
        : fallback.pain_points,
    growth_signals:
      Array.isArray(raw.growth_signals) ? raw.growth_signals.map(String) : fallback.growth_signals,
    risk_flags: Array.isArray(raw.risk_flags) ? raw.risk_flags.map(String) : [],
    why_viable:
      typeof raw.why_viable === 'string' && raw.why_viable.trim() ? raw.why_viable.trim() : fallback.why_viable,
    opening_line:
      typeof raw.opening_line === 'string' && raw.opening_line.trim()
        ? raw.opening_line.trim()
        : fallback.opening_line,
    talk_track:
      Array.isArray(raw.talk_track) && raw.talk_track.length >= 1
        ? raw.talk_track.map(String).slice(0, 5)
        : fallback.talk_track,
    commercial_foundation: {
      trust_signal:
        raw.commercial_foundation?.trust_signal && String(raw.commercial_foundation.trust_signal).trim()
          ? String(raw.commercial_foundation.trust_signal).trim()
          : fallback.commercial_foundation.trust_signal,
      common_ground:
        raw.commercial_foundation?.common_ground && String(raw.commercial_foundation.common_ground).trim()
          ? String(raw.commercial_foundation.common_ground).trim()
          : fallback.commercial_foundation.common_ground,
      personalized_value_prop:
        raw.commercial_foundation?.personalized_value_prop &&
        String(raw.commercial_foundation.personalized_value_prop).trim()
          ? String(raw.commercial_foundation.personalized_value_prop).trim()
          : fallback.commercial_foundation.personalized_value_prop,
      objection_prep:
        raw.commercial_foundation?.objection_prep && String(raw.commercial_foundation.objection_prep).trim()
          ? String(raw.commercial_foundation.objection_prep).trim()
          : fallback.commercial_foundation.objection_prep,
    },
  }
}

export async function generateInsights(scoredLeads, productContext) {
  const leads = Array.isArray(scoredLeads) ? scoredLeads.slice(0, 20) : []
  if (!leads.length) return []

  const fallbacks = leads.map((l) => fallbackInsight(l, productContext))
  const client = getClient()
  if (!client) {
    console.warn('[aiInsights] DEEPSEEK_API_KEY no configurado — usando insights de fallback')
    return fallbacks
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(leads, productContext) },
      ],
    })

    const content = completion?.choices?.[0]?.message?.content
    const parsed = extractJSON(content)
    if (!parsed || !Array.isArray(parsed.insights)) {
      console.warn('[aiInsights] No se pudo extraer JSON válido — usando fallback')
      return fallbacks
    }

    return leads.map((lead, idx) => {
      const fallback = fallbacks[idx]
      const matched =
        parsed.insights.find(
          (ins) =>
            ins &&
            typeof ins.business_name === 'string' &&
            ins.business_name.trim().toLowerCase() === lead.name.toLowerCase()
        ) || parsed.insights[idx]
      return normalizeInsight(matched, fallback)
    })
  } catch (err) {
    console.warn(`[aiInsights] Error llamando a DeepSeek: ${err?.message || err} — usando fallback`)
    return fallbacks
  }
}
