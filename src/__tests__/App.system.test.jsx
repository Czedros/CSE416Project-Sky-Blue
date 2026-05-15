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

    expect(await screen.findByRole("heading", { name: "Available Players" })).toBeInTheDocument();
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
});
