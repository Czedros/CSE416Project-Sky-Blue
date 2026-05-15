import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const fixtureDir = path.resolve(process.cwd(), "fixtures/player-api");
const activity9FixtureDir = path.join(fixtureDir, "activity-9");

const requiredFixtures = [
  { file: "test-case-1-before-draft.json", expectedCount: 0 },
  { file: "test-case-2-after-10-picks.json", expectedCount: 10 },
  { file: "test-case-3-after-50-picks.json", expectedCount: 50 },
  { file: "test-case-4-after-100-picks.json", expectedCount: 100 },
  { file: "test-case-5-after-130-picks.json", expectedCount: 130 },
];

function readFixture(file) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, file), "utf8"));
}

function readActivity9Fixture(file) {
  return JSON.parse(fs.readFileSync(path.join(activity9FixtureDir, file), "utf8"));
}

function expectApiReadyFixture(payload, expectedCount) {
  expect(Array.isArray(payload.playerIds)).toBe(true);
  expect(payload.playerIds.length).toBeGreaterThan(0);
  expect(payload.leagueSettings).toEqual(
    expect.objectContaining({
      budget: expect.any(Number),
      teams: expect.any(Number),
      scoringSystem: expect.any(String),
      rosterSpots: expect.objectContaining({
        hitters: expect.any(Number),
        pitchers: expect.any(Number),
      }),
      categories: expect.objectContaining({
        hitters: expect.any(Array),
        pitchers: expect.any(Array),
      }),
    })
  );
  expect(payload.draftState).toEqual(
    expect.objectContaining({
      playersDrafted: expect.any(Array),
    })
  );
  expect(payload.draftState.playersDrafted).toHaveLength(expectedCount);

  expect(Array.isArray(payload.draftState.preDraftRosters)).toBe(true);
  expect(Array.isArray(payload.draftState.minors)).toBe(true);
  expect(Array.isArray(payload.draftState.taxiDrafted)).toBe(true);

  for (const pick of payload.draftState.playersDrafted) {
    expect(pick).toEqual(
      expect.objectContaining({
        pickNumber: expect.any(Number),
        playerName: expect.any(String),
        price: expect.any(Number),
        position: expect.any(String),
        nominatingTeamName: expect.any(String),
        winningTeamName: expect.any(String),
      })
    );
    expect(pick.playerId === null || typeof pick.playerId === "number").toBe(true);
    expect(pick.price).toBeGreaterThanOrEqual(0);
  }
}

describe("Player API common-test fixtures", () => {
  it("includes all five required fixture files", () => {
    for (const fixture of requiredFixtures) {
      expect(fs.existsSync(path.join(fixtureDir, fixture.file)), fixture.file).toBe(true);
    }
  });

  it("has workbook-derived API fixture snapshots with the expected draft depth", () => {
    for (const fixture of requiredFixtures) {
      const payload = readFixture(fixture.file);
      expect(payload.fixtureMetadata).toEqual(
        expect.objectContaining({
          sourceWorkbook: "2026Draft.xlsx",
          draftedPlayerCount: fixture.expectedCount,
        })
      );
      expectApiReadyFixture(payload, fixture.expectedCount);
    }
  });

  it("includes the five Activity 9 common API request fixtures", () => {
    const activity9Files = [
      "test-case-1-standard-roto.json",
      "test-case-2-mid-draft-roto.json",
      "test-case-3-points-league.json",
      "test-case-4-deep-custom-roto.json",
      "test-case-5-late-draft.json",
    ];

    for (const file of activity9Files) {
      const payload = readActivity9Fixture(file);
      expect(payload.leagueSettings).toEqual(
        expect.objectContaining({
          budget: expect.any(Number),
          teams: expect.any(Number),
          scoringSystem: expect.any(String),
        })
      );
      expect(payload.draftState).toEqual(
        expect.objectContaining({
          playersDrafted: expect.any(Array),
        })
      );
    }
  });
});
