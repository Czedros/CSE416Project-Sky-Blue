import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const RUN_LIVE = process.env.RUN_LIVE_VALUATION_TESTS === "true";
const API_BASE_URL = (process.env.DRAFTKIT_API_URL || "http://localhost:3000").replace(/\/+$/, "");
const APP_CLIENT_KEY = process.env.DRAFTKIT_APP_CLIENT_KEY || "";

const describeLive = RUN_LIVE && APP_CLIENT_KEY ? describe : describe.skip;
const activity9FixtureDir = path.resolve(process.cwd(), "fixtures/player-api/activity-9");

const PLAYER_IDS = {
  shoheiOhtani: 660271,
  mookieBetts: 605141,
  aaronJudge: 592450,
};

const activity9Cases = [
  {
    name: "test case 1: standard 12-team roto before the draft",
    fixture: "test-case-1-standard-roto.json",
    extractPlayerId: PLAYER_IDS.shoheiOhtani,
  },
  {
    name: "test case 2: mid-draft 10-team roto",
    fixture: "test-case-2-mid-draft-roto.json",
    excludedPlayerIds: [PLAYER_IDS.mookieBetts, PLAYER_IDS.aaronJudge],
  },
  {
    name: "test case 3: 12-team points league before the draft",
    fixture: "test-case-3-points-league.json",
    extractPlayerId: PLAYER_IDS.shoheiOhtani,
  },
  {
    name: "test case 4: deep 15-team custom roto",
    fixture: "test-case-4-deep-custom-roto.json",
    extractPlayerId: PLAYER_IDS.shoheiOhtani,
  },
  {
    name: "test case 5: late draft with constrained budgets",
    fixture: "test-case-5-late-draft.json",
    excludedPlayerIds: [PLAYER_IDS.mookieBetts, PLAYER_IDS.aaronJudge, PLAYER_IDS.shoheiOhtani],
  },
];

function readFixture(file) {
  return JSON.parse(fs.readFileSync(path.join(activity9FixtureDir, file), "utf8"));
}

async function postAllValuations(payload) {
  const response = await fetch(`${API_BASE_URL}/api/players/value/all`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${APP_CLIENT_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  expect(response.ok, JSON.stringify(json)).toBe(true);
  return json;
}

function valuesByPlayerId(response) {
  return new Map((response?.values || []).map((row) => [Number(row.playerId), Number(row.value)]));
}

function expectPlausibleAuctionValue(value) {
  expect(Number.isFinite(value)).toBe(true);
  expect(value).toBeGreaterThanOrEqual(0);
  expect(value).toBeLessThanOrEqual(100);
}

describeLive("live Activity 9 Player API valuation checks", () => {
  for (const testCase of activity9Cases) {
    it(testCase.name, async () => {
      const response = await postAllValuations(readFixture(testCase.fixture));
      const values = valuesByPlayerId(response);

      expect(Array.isArray(response?.values)).toBe(true);
      expect(values.size).toBeGreaterThan(0);

      for (const value of values.values()) {
        expectPlausibleAuctionValue(value);
      }

      if (testCase.extractPlayerId) {
        expect(values.has(testCase.extractPlayerId)).toBe(true);
        expectPlausibleAuctionValue(values.get(testCase.extractPlayerId));
      }

      for (const playerId of testCase.excludedPlayerIds || []) {
        expect(values.has(playerId)).toBe(false);
      }
    });
  }
});

