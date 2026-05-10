# GTM Insights Module

Microservicio Node.js (ES Modules + Express) que actúa como **motor de inteligencia comercial GTM**.
Recibe el output del scraper (negocios scrapeados de Google Maps / OSM) más una descripción del ICP del producto, los limpia, calcula el **ICP Score**, estima métricas de marketing (LTV/CAC/ROAS/ROI/CPR), define tono y canal recomendado, llama a **DeepSeek** para generar inteligencia comercial accionable y devuelve un reporte estructurado con prospectos rankeados.

Stateless, sin base de datos. Un único endpoint: `POST /analyze`.

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
├── index.js          # servidor Express + manejo global de errores
├── analyzer.js       # adaptador del input + orquestador del pipeline
├── cleaner.js        # normaliza/sanitiza cada business + parsea fachada
├── scorer.js         # ICP Score (size + intent + fit + financial)
├── formulas.js       # LTV / CAC / ROAS / ROI / CPR + estimateMetrics
├── benchmarks.js     # rangos ACV/ACL/CAC por categoría
├── toneResolver.js   # tono / canal / mejor horario
├── aiInsights.js     # llamada a DeepSeek + extracción robusta de JSON
├── locationInsights.js # hotspots geográficos (Haversine + clustering) y bounds
├── reportBuilder.js  # JSON final + ranking + market_summary + location_summary
└── schemas.js        # schemas Zod del input
```

---

## Setup

```bash
cp .env.example .env
# editar .env y completar DEEPSEEK_API_KEY (opcional para arrancar)
npm install
npm start
```

| Variable | Default | Descripción |
|---|---|---|
| `DEEPSEEK_API_KEY` | — | Clave de DeepSeek. Si falta, se usan insights de fallback (el servicio no rompe). |
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

#### Request — formato del scraper

```json
{
  "category": "barbería",
  "zone": "Kennedy",
  "city": "Bogotá",
  "country": "Colombia",
  "icp_description": "SaaS para barberías que automatiza la agenda de citas, recordatorios por WhatsApp, programa de fidelización y reportes de caja diaria...",
  "query": { "...": "..." },
  "stats": { "...": "..." },
  "existing_businesses": [
    {
      "name": "Gold Skull Barber Tattoo",
      "category": "barbería",
      "zone": "Kennedy",
      "city": "Bogotá",
      "country": "Colombia",
      "address": "Cra. 73d #40-03",
      "latitude": 4.6155178,
      "longitude": -74.1522884,
      "phone": null, "whatsapp": null, "email": null, "website": null,
      "instagram": null, "facebook": null, "tiktok": null,
      "google_place_id": "ChIJqcmajEKfP44RfqfOb1XI5lQ",
      "google_maps_url": "https://www.google.com/maps/...",
      "rating": 4.6,
      "ratings_count": 21,
      "source": "google_maps_scrape",
      "status": "enriched",
      "notes": "La fachada presenta ladrillo rojo... | Features: Fachada de ladrillo rojo; Rejas de seguridad blancas; ..."
    }
  ]
}
```

**Reglas de validación:**

- `category` e `icp_description` son obligatorios.
- `zone`, `city`, `country` son opcionales (si faltan en un business individual, se heredan del nivel raíz).
- `existing_businesses` (alias soportado: `businesses`) debe ser un array no vacío de hasta 500 elementos.
- En cada business sólo `name` y `category` son obligatorios; el resto puede ser `null`.
- `query` y `stats` se aceptan como passthrough (vuelven en `metadata`).
- `notes` con el formato `"<descripción> | Features: <f1>; <f2>; ..."` se parsea a `facade.description` y `facade.features`.

#### Response

```json
{
  "metadata": {
    "total_processed": 6,
    "viable_count": 6,
    "processing_timestamp": "2026-05-10T04:53:47.431Z",
    "product_context_used": "SaaS para barberías — SaaS para barberías que automatiza la agenda de citas...",
    "context": { "category": "barbería", "zone": "Kennedy", "city": "Bogotá", "country": "Colombia", "icp_description": "..." },
    "query": { "...": "..." },
    "stats": { "...": "..." }
  },
  "market_summary": {
    "total_addressable_leads": 6,
    "avg_icp_score": 67.17,
    "avg_estimated_ltv": 2148,
    "avg_estimated_cac": 77,
    "market_opportunity": "Mercado con 6 prospectos viables de 6 analizados (100%), concentrados en barbería, predominantemente en Kennedy, con un LTV promedio estimado de USD 2148.",
    "top_categories": ["barbería"],
    "top_zones": ["Kennedy"],
    "recommended_approach": "presencial"
  },
  "location_summary": {
    "query": { "category": "barbería", "zone": "Kennedy", "city": "Bogotá", "country": "Colombia", "center": { "latitude": 4.630387, "longitude": -74.1376756, "radiusMeters": 1500 } },
    "stats": { "existingReceived": 1, "placesFound": 20, "dedupedAgainstExisting": 1, "newlyDiscovered": 5, "facadeDescribed": 5, "facadeSkipped": 1 },
    "coordinate_coverage": { "total_businesses": 6, "with_coordinates": 6, "coverage_ratio": 1 },
    "coordinate_bounds": { "north": 4.643557, "south": 4.615518, "east": -74.127298, "west": -74.152288 },
    "hotspots": [
      {
        "rank": 1, "label": "Hotspot 1 - Kennedy",
        "center": { "latitude": 4.621457, "longitude": -74.128722 },
        "radius_meters": 500, "business_count": 2, "avg_icp_score": 73.5,
        "dominant_zone": "Kennedy", "dominant_category": "barbería",
        "top_businesses": [{ "name": "BARBER TRAINING BOGOTÁ", "icp_score": 77, "status": "discovered", "source": "google_maps_scrape" }],
        "opportunity": "2 comercios de barbería concentrados en Kennedy, con score ICP promedio de 73.5."
      }
    ]
  },
  "ranked_prospects": [
    {
      "rank": 1,
      "business_name": "BARBER TRAINING BOGOTÁ",
      "category": "barbería",
      "subcategory": null,
      "location": { "zone": "Kennedy", "city": "Bogotá", "country": "Colombia", "address": "Cl. 1 Sur n 68 b 36", "latitude": 4.6209109, "longitude": -74.1272983 },
      "contact": { "phone": null, "whatsapp": null, "email": null, "website": null, "instagram": null, "facebook": null, "linkedin": null, "tiktok": null, "google_maps_url": "https://www.google.com/maps/..." },
      "source": { "provider": "google_maps_scrape", "status": "discovered", "google_place_id": "ChIJa28..." },
      "facade": { "description": null, "features": [] },
      "viability": {
        "icp_score": 77, "priority": "HIGH", "viable": true,
        "score_breakdown": { "size_score": 14, "intent_score": 13, "fit_score": 25, "financial_score": 25 }
      },
      "marketing_metrics": {
        "estimated_acv_usd": 166, "estimated_acl_months": 25, "estimated_ltv_usd": 4150,
        "estimated_cac_usd": 118, "ltv_cac_ratio": 35.17, "projected_roas": 35.17,
        "estimated_roi": 34.17, "cpr_estimate": 12, "metric_confidence": "MED"
      },
      "business_intelligence": {
        "estimated_size": "MID", "digital_presence_score": 1,
        "rating": 4.9, "ratings_count": 159,
        "pain_points": ["Gestión operativa diaria de barbería en Kennedy", "Captación constante de clientes nuevos y manejo de citas / agenda", "Fidelización y aumento del ticket promedio por cliente"],
        "growth_signals": ["Alta valoración pública (4.9 con 159 reseñas)"],
        "risk_flags": [],
        "why_viable": "BARBER TRAINING BOGOTÁ encaja con SaaS para barberías porque opera en barbería en Bogotá. SaaS para barberías que automatiza..."
      },
      "commercial_approach": {
        "recommended_channel": "presencial",
        "conversation_tone": "cercano",
        "best_contact_time": "Lunes a viernes, 11am–1pm",
        "opening_line": "Hola, vi a BARBER TRAINING BOGOTÁ en Kennedy, con calificación 4.9 (159 reseñas) y quería preguntarles cómo están manejando hoy la agenda y la fidelización de sus clientes.",
        "talk_track": ["...", "...", "..."],
        "commercial_foundation": { "trust_signal": "...", "common_ground": "...", "personalized_value_prop": "...", "objection_prep": "..." }
      }
    }
  ],
  "non_viable": [
    { "business_name": "...", "icp_score": 18, "reason": "Score muy bajo: ..." }
  ]
}
```

**Errores estructurados:**

| HTTP | `error` | Cuándo |
|---|---|---|
| 400 | `INVALID_INPUT` | Payload no cumple el schema (Zod) o JSON malformado. |
| 400 | `EMPTY_BUSINESSES` | El array `existing_businesses` (o `businesses`) está vacío. |
| 413 | `INVALID_INPUT` | Body > 10mb. |
| 502 | `AI_FAILURE` | Caso extremo: la IA propaga error en lugar de caer al fallback. |
| 500 | `INTERNAL_ERROR` | Error inesperado. |
| 404 | `NOT_FOUND` | Ruta no registrada. |

---

## Pipeline

1. **Adapter** — `analyzer.js` mapea el input del scraper a un `product_context` interno (deriva `name`, `description`, `target_industry`, `value_proposition` desde `icp_description`, `category`, `zone` y `city`).
2. **Clean** — `cleanAll(existing_businesses)` normaliza tipos, sanitiza strings, asegura protocolo en URLs, parsea `notes` a `facade.{description, features}` y descarta entradas sin `name`/`category`. Nunca lanza.
3. **Score** — `scoreAll` calcula 4 dimensiones (0–25 c/u): `size_score`, `intent_score`, `fit_score`, `financial_score`. Total `icp_score` ≤ 100. Clasificación: HIGH (≥70), MID (≥45), LOW viable (≥40), no viable (<40).
4. **Estimate metrics** — `estimateMetrics` interpola ACV/ACL/CAC dentro del benchmark de la categoría (incluye `barbería`, `peluquería`, `estética`, `spa`) según `size_score`, y calcula LTV, ratio LTV/CAC, ROAS, ROI y CPR.
5. **Tone & channel** — `resolveTone` define `tone` (formal/directo/consultivo/cercano/educativo), `channel` (cold_call/email/linkedin/whatsapp/presencial) considerando los nuevos campos sociales (instagram/facebook/linkedin/tiktok/whatsapp directo) y mejor horario.
6. **AI insights** — `generateInsights` toma el top-20 viable y hace **una sola llamada** a DeepSeek pidiendo JSON. **Pasa la descripción de la fachada y sus features al prompt** para opening lines hiperpersonalizados. Aplica extracción robusta (parse directo → fence markdown → regex de objeto) y, si todo falla o falta `DEEPSEEK_API_KEY`, genera **insights de fallback por negocio**. El servicio nunca rompe por la IA.
7. **Build report** — `buildReport` ordena por `icp_score`, asigna `rank`, calcula `digital_presence_score`, `estimated_size`, `metric_confidence`. Garantiza dos invariantes:
   - `estimated_ltv_usd === acv × acl`
   - `opening_line` contiene el nombre del negocio
   También construye `market_summary` (top categorías, top zonas, canal recomendado, descripción del mercado, promedios LTV/CAC/ICP), `location_summary` (ver siguiente punto) y `non_viable` con `reason` por umbral.
8. **Location summary** — `locationInsights.js` calcula sobre los businesses con `latitude`/`longitude`:
   - `coordinate_coverage` — cuántos prospectos tienen geolocalización.
   - `coordinate_bounds` — bounding box (north/south/east/west).
   - `hotspots` — clustering greedy por distancia Haversine usando como radio una fracción del `query.center.radiusMeters` (entre 250 y 700 m). Cada hotspot trae `center`, `business_count`, `avg_icp_score`, `dominant_zone`, `dominant_category`, top 5 negocios y una frase resumen de oportunidad.
   - `query` y `stats` se devuelven aquí también como passthrough listos para el frontend.

Regla "menos de 3 viables → incluir todos sin importar el score" implementada en `reportBuilder.js`.

---

## Compatibilidad con el formato anterior

Si quieres seguir usando el formato `{ product_context, businesses }` también funciona — basta enviar `category` + `icp_description` mínimos, y `product_context` (si lo envías) **sobrescribe** los valores derivados.

---

## Docker

```bash
docker build -t gtm-insights .
docker run -p 3000:3000 --env-file .env gtm-insights
```
