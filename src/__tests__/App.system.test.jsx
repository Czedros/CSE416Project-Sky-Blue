import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import {
  createDraft,
  fetchAllUserNotes,
  fetchDraftById,
  fetchPlayer,
  fetchPlayers,
  fetchPlayersValuationsAll,
  fetchPlayerValuation,
  fetchUserDrafts,
  fetchUserPlayerNote,
  login,
  postDraftPick,
  selectUserDraft,
  verifyToken,
} from "../services/api";

vi.mock("../services/api", () => ({
  createDraft: vi.fn(),
  fetchAllUserNotes: vi.fn(),
  fetchDraftById: vi.fn(),
  fetchDraftCompare: vi.fn(),
  fetchPlayer: vi.fn(),
  fetchPlayers: vi.fn(),
  fetchPlayersValuationsAll: vi.fn(),
  fetchPlayerValuation: vi.fn(),
  fetchTeamById: vi.fn(),
  fetchUserDrafts: vi.fn(),
  fetchUserPlayerNote: vi.fn(),
  login: vi.fn(),
  postDraftPick: vi.fn(),
  registerUser: vi.fn(),
  removeTeamPlayer: vi.fn(),
  saveUserPlayerNote: vi.fn(),
  selectUserDraft: vi.fn(),
  swapPlayerPosition: vi.fn(),
  undoLastPick: vi.fn(),
  verifyToken: vi.fn(),
}));

const players = [
  {
    id: "player-1",
    name: "Shohei Ohtani",
    position: ["DH"],
    team: "LAD",
    league: "NL",
    avg: 0.31,
    hr: 44,
    rbi: 95,
    sb: 20,
    stats: { HR: 44, RBI: 95, SB: 20, BA: 0.31 },
    fetchedAt: "2026-05-01T12:00:00.000Z",
  },
  {
    id: "player-2",
    name: "Aaron Judge",
    position: ["OF"],
    team: "NYY",
    league: "AL",
    avg: 0.29,
    hr: 52,
    rbi: 122,
    sb: 8,
    stats: { HR: 52, RBI: 122, SB: 8, BA: 0.29 },
    fetchedAt: "2026-05-01T12:00:00.000Z",
  },
];

const draftResponse = {
  draft: {
    _id: "draft-1",
    type: "Both",
    numberOfTeams: 2,
    budgetPerTeam: 260,
    rosterSlots: [
      { position: "DH", count: 1 },
      { position: "OF", count: 1 },
      { position: "Taxi", count: 1 },
    ],
    statCategories: {
      hitters: ["HR", "RBI", "SB", "BA"],
      pitchers: ["ERA", "K"],
    },
    pickHistory: [],
  },
  teams: [
    { _id: "team-1", name: "Blue Jays", budgetRemaining: 260, roster: [] },
    { _id: "team-2", name: "Red Sox", budgetRemaining: 260, roster: [] },
  ],
};

const fullDraftPlayers = [
  {
    id: "full-1",
    name: "Shohei Ohtani",
    position: ["DH"],
    team: "LAD",
    league: "NL",
    avg: 0.31,
    hr: 44,
    rbi: 95,
    sb: 20,
    stats: { HR: 44, RBI: 95, SB: 20, BA: 0.31 },
    fetchedAt: "2026-05-01T12:00:00.000Z",
  },
  {
    id: "full-2",
    name: "Yordan Alvarez",
    position: ["DH"],
    team: "HOU",
    league: "AL",
    avg: 0.305,
    hr: 36,
    rbi: 101,
    sb: 1,
    stats: { HR: 36, RBI: 101, SB: 1, BA: 0.305 },
    fetchedAt: "2026-05-01T12:00:00.000Z",
  },
  {
    id: "full-3",
    name: "Aaron Judge",
    position: ["OF"],
    team: "NYY",
    league: "AL",
    avg: 0.29,
    hr: 52,
    rbi: 122,
    sb: 8,
    stats: { HR: 52, RBI: 122, SB: 8, BA: 0.29 },
    fetchedAt: "2026-05-01T12:00:00.000Z",
  },
  {
    id: "full-4",
    name: "Mookie Betts",
    position: ["OF"],
    team: "LAD",
    league: "NL",
    avg: 0.295,
    hr: 35,
    rbi: 100,
    sb: 12,
    stats: { HR: 35, RBI: 100, SB: 12, BA: 0.295 },
    fetchedAt: "2026-05-01T12:00:00.000Z",
  },
];

function renderApp(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  );
}

function mockSignedOutDefaults() {
  fetchPlayers.mockResolvedValue(players);
  fetchPlayersValuationsAll.mockResolvedValue({ values: [] });
  fetchUserDrafts.mockResolvedValue({ drafts: [] });
  fetchDraftById.mockResolvedValue(draftResponse);
  fetchAllUserNotes.mockResolvedValue({ notes: [] });
  selectUserDraft.mockResolvedValue({});
}

function mockSignedInUser(userOverrides = {}) {
  localStorage.setItem("authToken", "token-123");
  verifyToken.mockResolvedValue({
    id: "u1",
    username: "skyblue",
    drafts: ["draft-1"],
    activeDraft: "draft-1",
    ...userOverrides,
  });
  fetchUserDrafts.mockResolvedValue({
    drafts: [draftResponse.draft],
    activeDraft: "draft-1",
  });
  fetchDraftById.mockResolvedValue(draftResponse);
  fetchPlayers.mockResolvedValue(players);
  fetchPlayersValuationsAll.mockResolvedValue({
    values: [
      { playerId: "player-1", value: 45 },
      { playerId: "player-2", value: 38 },
    ],
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildFullDraftState(overrides = {}) {
  return {
    draft: {
      _id: "full-draft",
      type: "Both",
      numberOfTeams: 2,
      budgetPerTeam: 100,
      rosterSlots: [
        { position: "DH", count: 1 },
        { position: "OF", count: 1 },
      ],
      statCategories: {
        hitters: ["HR", "RBI", "SB", "BA"],
        pitchers: ["ERA", "K"],
      },
      pickHistory: [],
    },
    teams: [
      { _id: "team-1", name: "Blue Jays", budgetRemaining: 100, roster: [] },
      { _id: "team-2", name: "Red Sox", budgetRemaining: 100, roster: [] },
    ],
    ...overrides,
  };
}

function mockMutableDraftBackend({ state = buildFullDraftState(), availablePlayers = fullDraftPlayers } = {}) {
  const valuationById = {
    "full-1": 45,
    "full-2": 36,
    "full-3": 38,
    "full-4": 34,
  };

  localStorage.setItem("authToken", "token-123");
  verifyToken.mockResolvedValue({
    id: "u1",
    username: "skyblue",
    drafts: [state.draft._id],
    activeDraft: state.draft._id,
  });
  fetchUserDrafts.mockResolvedValue({
    drafts: [state.draft],
    activeDraft: state.draft._id,
  });
  fetchPlayers.mockResolvedValue(availablePlayers);
  fetchPlayer.mockImplementation((playerId) =>
    Promise.resolve(availablePlayers.find((player) => player.id === playerId))
  );
  fetchPlayerValuation.mockImplementation((playerId) =>
    Promise.resolve({ value: valuationById[playerId] ?? 1 })
  );
  fetchUserPlayerNote.mockResolvedValue({ note: "" });
  fetchDraftById.mockImplementation(() => Promise.resolve(clone(state)));
  fetchPlayersValuationsAll.mockImplementation((playerIds) =>
    Promise.resolve({
      values: playerIds.map((playerId) => ({
        playerId,
        value: valuationById[playerId] ?? 1,
      })),
    })
  );
  postDraftPick.mockImplementation((draftId, pickData) => {
    const team = state.teams.find((candidate) => candidate._id === pickData.teamId);
    const player = availablePlayers.find((candidate) => candidate.id === pickData.playerId);
    const nominator = state.teams.find((candidate) => candidate._id === pickData.nominatorTeamId);

    team.budgetRemaining -= pickData.price;
    team.roster.push({
      playerId: pickData.playerId,
      playerName: pickData.playerName,
      position: pickData.position,
      price: pickData.price,
      stats: pickData.stats,
    });
    state.draft.pickHistory.push({
      ...pickData,
      teamName: team.name,
      nominatorTeamName: nominator?.name || null,
      timestamp: "2026-05-01T12:00:00.000Z",
    });

    return Promise.resolve({ pick: { ...pickData, player } });
  });

  return state;
}

async function draftPlayer(user, { playerName, teamId, position, nominatorTeamId, price }) {
  expect(await screen.findByText(playerName)).toBeInTheDocument();
  await user.click(within(screen.getByRole("row", { name: new RegExp(playerName, "i") })).getByRole("button", { name: "View" }));

  expect(await screen.findByRole("heading", { name: playerName })).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText(/select team/i), teamId);
  await user.selectOptions(screen.getByLabelText(/^position$/i), position);
  await user.selectOptions(screen.getByLabelText(/nominator team/i), nominatorTeamId);
  await user.type(screen.getByLabelText(/draft price/i), String(price));
  await user.click(screen.getByRole("button", { name: "Draft Player" }));

  expect(await screen.findByText(`${playerName} drafted for $${price}!`)).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.queryByRole("row", { name: new RegExp(playerName, "i") })).not.toBeInTheDocument();
  });
}

describe("App system flows", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockSignedOutDefaults();
  });

  it("lets a signed-out user log in and reach the protected player list", async () => {
    login.mockResolvedValue({
      token: "token-123",
      user: { id: "u1", username: "skyblue", drafts: [], activeDraft: null },
    });

    const user = userEvent.setup();
    renderApp("/app");

    expect(await screen.findByRole("heading", { name: "DraftKit" })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/username/i), "skyblue");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText("Shohei Ohtani")).toBeInTheDocument();
    expect(localStorage.getItem("authToken")).toBe("token-123");
    expect(login).toHaveBeenCalledWith("skyblue", "password123");
  });

  it("saves a new draft setup and opens the protected app with that draft active", async () => {
    mockSignedInUser({ drafts: [], activeDraft: null });
    fetchUserDrafts.mockResolvedValue({ drafts: [], activeDraft: null });
    createDraft.mockResolvedValue({
      draft: { ...draftResponse.draft, _id: "draft-new" },
    });

    const user = userEvent.setup();
    renderApp("/draft-setup");

    expect(await screen.findByRole("heading", { name: "Draft Setup" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/number of teams/i), {
      target: { value: "2" },
    });

    await user.type(screen.getByLabelText(/^Team 1$/), "Blue Jays");
    await user.type(screen.getByLabelText(/^Team 2$/), "Red Sox");
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(createDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "Both",
          numberOfTeams: 2,
          budgetPerTeam: 260,
          teamNames: ["Blue Jays", "Red Sox"],
          statCategories: expect.objectContaining({
            hitters: expect.arrayContaining(["AVG", "HR", "RBI"]),
            pitchers: expect.arrayContaining(["ERA", "K"]),
          }),
        })
      );
    });

    expect(await screen.findByText("Shohei Ohtani")).toBeInTheDocument();
  });

  it("drafts a player from the available list and records the pick in draft history", async () => {
    mockSignedInUser();
    fetchPlayer.mockResolvedValue(players[0]);
    fetchPlayerValuation.mockResolvedValue({ value: 45 });
    fetchUserPlayerNote.mockResolvedValue({ note: "" });
    postDraftPick.mockResolvedValue({ ok: true });

    const user = userEvent.setup();
    renderApp("/app");

    expect(await screen.findByText("Shohei Ohtani")).toBeInTheDocument();
    const ohtaniRow = screen.getByRole("row", { name: /Shohei Ohtani/i });
    await user.click(within(ohtaniRow).getByRole("button", { name: "View" }));

    expect(await screen.findByRole("heading", { name: "Shohei Ohtani" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/select team/i), "team-1");
    await user.selectOptions(screen.getByLabelText(/^position$/i), "DH");
    await user.selectOptions(screen.getByLabelText(/nominator team/i), "team-2");
    await user.type(screen.getByLabelText(/draft price/i), "45");
    await user.click(screen.getByRole("button", { name: "Draft Player" }));

    await waitFor(() => {
      expect(postDraftPick).toHaveBeenCalledWith("draft-1", {
        playerId: "player-1",
        playerName: "Shohei Ohtani",
        position: "DH",
        price: 45,
        teamId: "team-1",
        nominatorTeamId: "team-2",
        stats: { HR: 44, RBI: 95, SB: 20, BA: 0.31 },
      });
    });

    expect(await screen.findByText("Shohei Ohtani drafted for $45!")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /draft history/i }));

    expect(await screen.findByRole("heading", { name: "Draft History" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Shohei Ohtani" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Blue Jays" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Red Sox" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "$45" })).toBeInTheDocument();
  });

  it("simulates a full two-team draft and refreshes valuations after each pick", async () => {
    mockMutableDraftBackend();

    const user = userEvent.setup();
    renderApp("/app");

    expect(await screen.findByText("Shohei Ohtani")).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchPlayersValuationsAll).toHaveBeenCalledWith(["full-1", "full-2", "full-3", "full-4"]);
    });

    await draftPlayer(user, {
      playerName: "Shohei Ohtani",
      teamId: "team-1",
      position: "DH",
      nominatorTeamId: "team-2",
      price: 45,
    });
    await waitFor(() => {
      expect(fetchPlayersValuationsAll).toHaveBeenCalledWith(["full-2", "full-3", "full-4"]);
    });

    await draftPlayer(user, {
      playerName: "Yordan Alvarez",
      teamId: "team-2",
      position: "DH",
      nominatorTeamId: "team-1",
      price: 36,
    });
    await waitFor(() => {
      expect(fetchPlayersValuationsAll).toHaveBeenCalledWith(["full-3", "full-4"]);
    });

    await draftPlayer(user, {
      playerName: "Aaron Judge",
      teamId: "team-1",
      position: "OF",
      nominatorTeamId: "team-2",
      price: 38,
    });
    await waitFor(() => {
      expect(fetchPlayersValuationsAll).toHaveBeenCalledWith(["full-4"]);
    });

    await draftPlayer(user, {
      playerName: "Mookie Betts",
      teamId: "team-2",
      position: "OF",
      nominatorTeamId: "team-1",
      price: 34,
    });

    expect(await screen.findByText("No players match your filters.")).toBeInTheDocument();
    expect(postDraftPick).toHaveBeenCalledTimes(4);
    expect(postDraftPick).toHaveBeenNthCalledWith(
      1,
      "full-draft",
      expect.objectContaining({ playerId: "full-1", teamId: "team-1", price: 45 })
    );
    expect(postDraftPick).toHaveBeenNthCalledWith(
      4,
      "full-draft",
      expect.objectContaining({ playerId: "full-4", teamId: "team-2", price: 34 })
    );

    await user.click(screen.getByRole("link", { name: /draft history/i }));

    expect(await screen.findByRole("heading", { name: "Draft History" })).toBeInTheDocument();
    expect(screen.getByText("4 picks made")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /1 Shohei Ohtani DH Red Sox Blue Jays \$45/i })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /2 Yordan Alvarez DH Blue Jays Red Sox \$36/i })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /3 Aaron Judge OF Red Sox Blue Jays \$38/i })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /4 Mookie Betts OF Blue Jays Red Sox \$34/i })).toBeInTheDocument();
  });

  it("blocks draft picks that exceed budget or overfill a roster slot", async () => {
    const constrainedState = buildFullDraftState({
      teams: [
        { _id: "team-1", name: "Blue Jays", budgetRemaining: 10, roster: [] },
        {
          _id: "team-2",
          name: "Red Sox",
          budgetRemaining: 100,
          roster: [{ playerId: "taken-dh", playerName: "Taken DH", position: "DH", price: 1 }],
        },
      ],
    });
    mockMutableDraftBackend({ state: constrainedState });

    const user = userEvent.setup();
    renderApp("/app");

    expect(await screen.findByText("Shohei Ohtani")).toBeInTheDocument();
    await user.click(within(screen.getByRole("row", { name: /Shohei Ohtani/i })).getByRole("button", { name: "View" }));

    expect(await screen.findByRole("heading", { name: "Shohei Ohtani" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/select team/i), "team-1");
    await user.selectOptions(screen.getByLabelText(/^position$/i), "DH");
    await user.selectOptions(screen.getByLabelText(/nominator team/i), "team-2");
    await user.type(screen.getByLabelText(/draft price/i), "45");
    await user.click(screen.getByRole("button", { name: "Draft Player" }));

    expect(await screen.findByText("Budget exceeded — Blue Jays has $10 remaining but needs $45.")).toBeInTheDocument();
    expect(postDraftPick).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByLabelText(/select team/i), "team-2");
    await user.clear(screen.getByLabelText(/draft price/i));
    await user.type(screen.getByLabelText(/draft price/i), "5");
    await user.click(screen.getByRole("button", { name: "Draft Player" }));

    expect(await screen.findByText("No open DH slots — Red Sox has 1/1 filled.")).toBeInTheDocument();
    expect(postDraftPick).not.toHaveBeenCalled();
  });
});
