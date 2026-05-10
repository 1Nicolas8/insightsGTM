# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**GTM Insights Module** — A stateless Node.js (ES Modules + Express 4) microservice that acts as a B2B Go-To-Market commercial intelligence engine. Single endpoint `POST /analyze` plus `GET /health`.

### Running the service

- **Dev mode:** `npm run dev` (uses `node --watch` for hot reload, port 3000)
- **Production:** `npm start`
- The `.env` file must exist (copy from `.env.example`). The service works without `DEEPSEEK_API_KEY` by generating fallback insights.

### Key caveats

- No test framework or linter is configured in this repo. There are no `test` or `lint` npm scripts.
- The codebase uses ES Modules (`"type": "module"` in `package.json`). All imports use `.js` extensions.
- Node.js ≥ 20 is required (`engines` field in `package.json`).
- The `punycode` deprecation warning from Node 22+ is cosmetic and does not affect functionality.
- The `POST /analyze` endpoint accepts a JSON body with `product_context` and `businesses` array. See `README.md` for the full schema and example payloads.

### Testing the service

Since there is no automated test suite, verify manually:

```bash
# Health check
curl http://localhost:3000/health

# Full analysis (see README.md for complete example payload)
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"product_context":{"name":"Test","description":"Test product","target_industry":"Tech","price_range":"$100/mo","value_proposition":"Saves time"},"businesses":[{"name":"Acme Corp","category":"Software"}]}'
```
