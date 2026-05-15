# Player API Common-Test Fixtures

These fixtures are intended for the Activity #9 common Player API evaluation.

The API-friendly request shape is:

```json
{
  "playerIds": [660271, 605141],
  "leagueSettings": {
    "budget": 260,
    "teams": 12,
    "scoringSystem": "roto",
    "rosterSpots": {
      "hitters": 14,
      "pitchers": 9
    },
    "categories": {
      "hitters": ["BA", "HR", "R", "RBI", "SB"],
      "pitchers": ["ERA", "WHIP", "W", "SV", "K"]
    }
  },
  "draftState": {
    "playersDrafted": [
      {
        "playerId": 660271,
        "price": 45,
        "position": "DH"
      }
    ]
  }
}
```

## Fixture Set

The five common-test states should be stored as:

- `test-case-1-before-draft.json`
- `test-case-2-after-10-picks.json`
- `test-case-3-after-50-picks.json`
- `test-case-4-after-100-picks.json`
- `test-case-5-after-130-picks.json`

Each file should be directly POST-able to:

- `POST /api/players/value` for batch valuations
- `POST /api/player/value` for single-player valuations, replacing `playerIds` with `playerId`

## Workbook Mapping

When the provided workbook is available, map it into these fields:

- `Pre-Draft Roster`: used to establish keeper/current roster context if the API needs it.
- `Minors`: include in a future `draftState.minors` field if minor-league context is needed.
- `Draft`: source of `draftState.playersDrafted`.
- `Final Roster`: validation reference after all auction picks.
- `Taxi draft`: include in a future `draftState.taxiDrafted` field if taxi draft context is needed.

For the five required snapshots, slice the `Draft` worksheet like this:

- Before draft: `playersDrafted: []`
- After 10 picks: first 10 drafted rows
- After 50 picks: first 50 drafted rows
- After 100 picks: first 100 drafted rows
- After 130 picks: first 130 drafted rows

Each drafted row from the workbook becomes:

```json
{
  "pickNumber": 1,
  "nominatingTeamName": "Team E",
  "playerName": "William Contreras",
  "playerId": null,
  "position": "C",
  "mlbTeam": "MIL",
  "winningTeamName": "Team D",
  "price": 25
}
```

The provided workbook does not include numeric MLB player IDs for drafted players. Those rows are preserved with `playerId: null` and should be enriched with numeric IDs if the target Player API requires drafted players to be identified by ID.

## Current Status

All five fixture files have been generated from `2026Draft.xlsx`.
