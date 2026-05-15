# DraftKit App (Frontend)

This is the DraftKit web client that consumes the standalone [DraftKit API](https://github.com/prattaydey/CSE416Project-Sky-Blue-API) with API key in authorization header of HTTP request.

## Routes
- `/` -> available players list
- `/player/:playerId` -> player detail screen
- `/player/:playerId?username=<username>` -> loads/saves notes for that user from client backend

## Required environment variables
Create `.env` from `.env.example`:

- `VITE_API_BASE_URL` (DraftKit API base URL for player data)
- `VITE_CLIENT_BACKEND_URL` (client app backend URL for users/notes)
- `VITE_APP_CLIENT_KEY` (must match API `APP_CLIENT_KEY`)

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Tests
Run the normal test suite:
```bash
npm test
```

The normal suite includes component tests and mocked system-flow tests. Live API valuation tests are present, but skipped by default so local and CI runs do not depend on network access or API credentials.

Run only the live valuation API tests:
```bash
npm run test:live:valuation
```

To enable the live valuation tests, set these environment variables first:

- `RUN_LIVE_VALUATION_TESTS=true`
- `DRAFTKIT_API_URL` - base URL for the DraftKit API
- `DRAFTKIT_APP_CLIENT_KEY` - API key accepted by the DraftKit API

PowerShell example:
```powershell
$env:RUN_LIVE_VALUATION_TESTS="true"
$env:DRAFTKIT_API_URL="https://your-api-url"
$env:DRAFTKIT_APP_CLIENT_KEY="your-api-key"
npm run test:live:valuation
```

Bash example:
```bash
RUN_LIVE_VALUATION_TESTS=true \
DRAFTKIT_API_URL="https://your-api-url" \
DRAFTKIT_APP_CLIENT_KEY="your-api-key" \
npm run test:live:valuation
```

### Live Player API evaluation checklist
These items map to the course Player API/common evaluation requirements:

- Key generated: provide `DRAFTKIT_APP_CLIENT_KEY` when running live tests.
- Account generated: not required by this frontend test harness unless the deployed API requires one.
- API URL provided: set `DRAFTKIT_API_URL`.
- API endpoints provided:
  - `POST /api/players/value`
  - `POST /api/player/value`
- Test Case 1 JSON provided: `fixtures/player-api/test-case-1-before-draft.json`
- Test Case 2-5 JSON provided from `2026Draft.xlsx`:
  - `fixtures/player-api/test-case-2-after-10-picks.json`
  - `fixtures/player-api/test-case-3-after-50-picks.json`
  - `fixtures/player-api/test-case-4-after-100-picks.json`
  - `fixtures/player-api/test-case-5-after-130-picks.json`
  - The workbook does not include numeric `playerId` values for drafted players, so those entries currently preserve `playerName`, `position`, MLB team, winning team, nominating team, and price with `playerId: null`.
- Request example provided:

```bash
curl -X POST "$DRAFTKIT_API_URL/api/players/value" \
  -H "Authorization: Bearer $DRAFTKIT_APP_CLIENT_KEY" \
  -H "Content-Type: application/json" \
  --data @fixtures/player-api/test-case-1-before-draft.json
```

- Successful Request for Test Case 1 completed: run `npm run test:live:valuation` with live env vars.
- Player extracted from request completed: the live test extracts values by `playerId` from the response.
- Test Case 1 working: before-draft batch valuation.
- Test Case 2 working: after 10 drafted players.
- Test Case 3 working: after 50 drafted players.
- Test Case 4 working: single-player valuation after 100 drafted players.
- Test Case 5 working: late-draft batch valuation after 130 drafted players.

See `fixtures/player-api/README.md` for the expected fixture schema and workbook-to-JSON mapping.

### Activity 9 fixtures
The JSON examples from `CSE 416 Activity Activity #9.txt` are stored separately from the workbook-derived draft snapshots:

- `fixtures/player-api/activity-9/test-case-1-standard-roto.json`
- `fixtures/player-api/activity-9/test-case-2-mid-draft-roto.json`
- `fixtures/player-api/activity-9/test-case-3-points-league.json`
- `fixtures/player-api/activity-9/test-case-4-deep-custom-roto.json`
- `fixtures/player-api/activity-9/test-case-5-late-draft.json`

The live valuation test command posts these Activity 9 fixtures to:

```text
POST /api/players/value/all
```
