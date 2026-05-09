# GTM Insights Module

Microservicio Node.js (ES Modules + Express) que actúa como **motor de inteligencia comercial GTM**.
Recibe negocios crudos (scrapeados de Google Maps u otras fuentes), los limpia, calcula su **ICP Score**, estima métricas de marketing (LTV/CAC/ROAS/ROI/CPR), define tono y canal recomendado, llama a **DeepSeek** para generar inteligencia comercial accionable y devuelve un reporte estructurado con prospectos rankeados.

Stateless, sin base de datos, un único endpoint: `POST /analyze`.

---

## Stack

- Node.js 20+ (ES Modules)
- Express 4
- Zod (validación de input)
- OpenAI SDK apuntando a DeepSeek (`https://api.deepseek.com`, modelo `deepseek-chat`)

---

## Estructura

```
src/
├── index.js            # servidor Express + manejo global de errores
├── analyzer.js         # orquesta el pipeline completo
├── cleaner.js          # normaliza y sanitiza cada business
├── scorer.js           # calcula ICP Score (size + intent + fit + financial)
├── formulas.js         # fórmulas LTV / CAC / ROAS / ROI / CPR
├── benchmarks.js       # rangos ACV/ACL/CAC por categoría
├── toneResolver.js     # determina tono y canal recomendado
├── aiInsights.js       # llamada a DeepSeek + extracción robusta de JSON
├── reportBuilder.js    # construye el JSON final ordenado
└── schemas.js          # schemas Zod del input
```

---

## Setup

```bash
cp .env.example .env
# editar .env y completar DEEPSEEK_API_KEY
npm install
npm start
```

Variables de entorno:

| Variable | Default | Descripción |
|---|---|---|
| `DEEPSEEK_API_KEY` | — | Clave de DeepSeek. Si falta, el servicio funciona pero usa insights de fallback. |
| `PORT` | `3000` | Puerto HTTP. |
| `MAX_BUSINESSES_PER_REQUEST` | `500` | Límite duro de elementos por request. |
| `AI_BATCH_SIZE` | `20` | Top-N viables enviados a la IA en una sola llamada. |
| `NODE_ENV` | `development` | — |

---

## Endpoints

### `GET /health`

```json
{ "status": "ok", "timestamp": "2026-05-09T19:00:00.000Z" }
```

### `POST /analyze`

**Request:**

```json
{
  "product_context": {
    "name": "SalesBot CRM",
    "description": "CRM con automatización de seguimiento para pequeñas empresas",
    "target_industry": "Agencias, consultoras, servicios B2B",
    "price_range": "$150-$400/mes",
    "value_proposition": "Elimina el seguimiento manual y aumenta el cierre de ventas un 30%"
  },
  "businesses": [
    {
      "name": "Agencia Creativa Nómada",
      "category": "Agencia de marketing",
      "city": "Bogotá",
      "country": "Colombia",
      "phone": "+57 300 123 4567",
      "website": "https://nomada.co",
      "rating": 4.7,
      "reviews_count": 89,
      "price_level": 3,
      "verified": true
    }
  ]
}
```

**Reglas de validación:**

- `product_context` completo es obligatorio.
- `businesses` debe ser un array no vacío de hasta 500 elementos.
- En cada business solo `name` y `category` son obligatorios.

**Response (resumida):**

```json
{
  "metadata": { "total_processed": 1, "viable_count": 1, "processing_timestamp": "...", "product_context_used": "..." },
  "market_summary": { "total_addressable_leads": 1, "avg_icp_score": 82, "top_categories": ["Agencia de marketing"], "recommended_approach": "email", "..." : "..." },
  "ranked_prospects": [
    {
      "rank": 1,
      "business_name": "Agencia Creativa Nómada",
      "viability": { "icp_score": 82, "priority": "HIGH", "viable": true, "score_breakdown": { "size_score": 17, "intent_score": 22, "fit_score": 24, "financial_score": 19 } },
      "marketing_metrics": { "estimated_acv_usd": 1090, "estimated_acl_months": 19, "estimated_ltv_usd": 20710, "estimated_cac_usd": 468, "ltv_cac_ratio": 44.25, "metric_confidence": "HIGH" },
      "business_intelligence": { "estimated_size": "SMALL", "digital_presence_score": 6, "pain_points": ["..."], "why_viable": "..." },
      "commercial_approach": { "recommended_channel": "email", "conversation_tone": "directo", "best_contact_time": "Lunes a miércoles, 10am–12pm", "opening_line": "Hola, vi que Agencia Creativa Nómada ...", "talk_track": ["..."], "commercial_foundation": { "..." : "..." } }
    }
  ],
  "non_viable": []
}
```

**Errores estructurados:**

| HTTP | `error` | Cuándo |
|---|---|---|
| 400 | `INVALID_INPUT` | Payload no cumple el schema. |
| 400 | `EMPTY_BUSINESSES` | El array `businesses` está vacío. |
| 502 | `AI_FAILURE` | La llamada a DeepSeek falló (caso extremo: el servicio normalmente cae a insights de fallback en lugar de propagar). |
| 500 | `INTERNAL_ERROR` | Error inesperado. |

---

## Pipeline

1. **Clean** — `cleanAll(businesses)` normaliza tipos, sanitiza strings, asegura protocolo en URLs y descarta entradas sin `name`/`category`.
2. **Score** — `scoreAll` calcula 4 dimensiones (0–25 c/u): `size_score`, `intent_score`, `fit_score`, `financial_score`. Total `icp_score` ≤ 100. Clasifica como HIGH (≥70), MID (≥45), LOW viable (≥40), o no viable (<40).
3. **Estimate metrics** — `estimateMetrics` interpola ACV/ACL/CAC dentro del benchmark de la categoría según `size_score`, y calcula LTV, ratio LTV/CAC, ROAS, ROI y CPR.
4. **Tone & channel** — `resolveTone` define `tone` (formal/directo/consultivo/cercano/educativo), `channel` (cold_call/email/linkedin/whatsapp/presencial) y mejor horario.
5. **AI insights** — `generateInsights` toma el top-20 viable y pide a DeepSeek un único JSON con `pain_points`, `growth_signals`, `risk_flags`, `why_viable`, `opening_line`, `talk_track` y `commercial_foundation`. Si DeepSeek falla o el JSON no se puede extraer, se generan insights de fallback **por negocio** (el servicio nunca rompe por la IA).
6. **Build report** — `buildReport` ordena por `icp_score`, asigna `rank`, calcula `digital_presence_score`, `estimated_size`, `metric_confidence`, garantiza que `estimated_ltv_usd === acv × acl` y que `opening_line` contenga el nombre del negocio, y construye `market_summary` (top categorías, canal recomendado, descripción del mercado).

---

## Docker

```bash
docker build -t gtm-insights .
docker run -p 3000:3000 --env-file .env gtm-insights
```
