import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchTeamById, removeTeamPlayer, swapPlayerPosition, fetchPlayer } from "../services/api";
import { DraftContext } from "../context/DraftContext";
import { useToast } from "../context/ToastContext";

import "./TeamPage.css";

function formatCurrency(amount) {
  return `$${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function TeamPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingPlayerId, setSavingPlayerId] = useState(null);
  const { removePlayer } = useContext(DraftContext);
  const [swappingPlayerId, setSwappingPlayerId] = useState(null);
  const [eligiblePositionsMap, setEligiblePositionsMap] = useState({});
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;

    async function loadTeam() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchTeamById(teamId);
        if (!cancelled) {
          setTeam(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load team data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTeam();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  useEffect(() => {
  if (!team?.roster?.length) return;

  let cancelled = false;

  async function loadEligiblePositions() {
    const entries = await Promise.all(
      team.roster.map(async (item) => {
        if (!item.playerId) return [item.playerId, []];
        if (eligiblePositionsMap[item.playerId]) {
          return [item.playerId, eligiblePositionsMap[item.playerId]];
        }
        try {
          const playerData = await fetchPlayer(item.playerId);
          const positions = Array.isArray(playerData.position)
            ? playerData.position
            : typeof playerData.position === "string"
            ? [playerData.position]
            : [];
          return [item.playerId, positions];
        } catch {
          return [item.playerId, []];
        }
      })
    );

    if (!cancelled) {
      setEligiblePositionsMap((prev) => {
        const next = { ...prev };
        for (const [id, positions] of entries) {
          if (id) next[id] = positions;
        }
        return next;
      });
    }
  }

  loadEligiblePositions();
  return () => { cancelled = true; };
}, [team?.roster]);

  const roster = team?.roster || [];
  const draft = team?.draft;

  const spent = useMemo(
    () => roster.reduce((sum, item) => sum + (Number(item.amountPaid) || 0), 0),
    [roster]
  );

  const totalBudget = draft?.budgetPerTeam ?? spent + (team?.budgetRemaining ?? 0);
  const remainingBudget = team?.budgetRemaining ?? 0;
  const percentUsed = totalBudget ? Math.round((spent / totalBudget) * 100) : 0;

  const positionSlots = useMemo(() => {
    if (!draft?.rosterSlots) return [];
    return draft.rosterSlots.map((slot) => ({
      ...slot,
      filled: roster.filter((item) => item.position === slot.position).length,
    }));
  }, [draft, roster]);

  const stats = useMemo(() => {
    const playerCount = roster.length;
    const pitchers = roster.filter((item) => {
      const position = String(item.position || "").toUpperCase();
      return position.includes("P");
    }).length;
    const hitters = playerCount - pitchers;
    return {
      playerCount,
      avgPrice: playerCount ? (spent / playerCount).toFixed(1) : 0,
      hitters,
      pitchers,
    };
  }, [roster, spent]);

  const handleRemovePlayer = async (playerId) => {
    setError("");
    setSavingPlayerId(playerId);

    try {
      const updated = await removeTeamPlayer(teamId, playerId);
      setTeam(updated);
      removePlayer(playerId);
    } catch (err) {
      setError(err.message || "Unable to remove player.");
    } finally {
      setSavingPlayerId(null);
    }
  };
  const handleSwapPosition = async (playerId, newPosition) => {
  if (!newPosition) return;
  setSwappingPlayerId(playerId);

  try {
    const updated = await swapPlayerPosition(teamId, playerId, newPosition);
    setTeam((prev) => ({ ...prev, roster: updated.roster }));
    toast.success(`${updated.swapped?.playerName ?? "Player"} moved to ${newPosition}`);
  } catch (err) {
    toast.error(err.message || "Unable to swap player position.");
  } finally {
    setSwappingPlayerId(null);
  }
};

  if (loading) {
    return (
      <div className="team-page">
        <div className="team-loading">Loading team information…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-page">
        <div className="team-error">
          <button className="back-btn" onClick={() => navigate("/app", { replace: true })}>
            ← Back
          </button>
          <p>{error}</p>
        </div>
      </div>
    );
  }
// Ai generated 
  return (
    <div className="team-page">
      <div className="team-header">
        <button className="back-btn" onClick={() => navigate("/app", { replace: true })}>
          ← Back
        </button>
        <div>
          <h2>{team?.name || "Team"}</h2>
          <p className="team-subtitle">Viewing roster and draft slot status</p>
        </div>
      </div>

      <div className="team-summary-grid">
        <div className="team-summary-card">
          <div className="summary-row">
            <div>
              <p className="summary-label">Total Budget</p>
              <p className="summary-value">{formatCurrency(totalBudget)}</p>
            </div>
            <div>
              <p className="summary-label">Spent</p>
              <p className="summary-value spent">{formatCurrency(spent)}</p>
            </div>
            <div>
              <p className="summary-label">Remaining</p>
              <p className="summary-value remaining">{formatCurrency(remainingBudget)}</p>
            </div>
          </div>
          <div className="budget-bar-wrapper">
            <div className="budget-bar">
              <div className="budget-bar-fill" style={{ width: `${Math.min(percentUsed, 100)}%` }} />
            </div>
            <span className="budget-bar-label">Budget Used {percentUsed}%</span>
          </div>
        </div>
      </div>

      <div className="team-main-grid">
        <div className="team-roster-card">
          <div className="team-roster-header">
            <div>
              <h3>Current Roster ({stats.playerCount})</h3>
              <p>Shows drafted players, position, and the price paid.</p>
            </div>
          </div>
          {roster.length === 0 ? (
            <div className="empty-roster">This team has no drafted players yet.</div>
          ) : (
            <table className="team-roster-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {roster.map((player) => {
                  const eligible = eligiblePositionsMap[player.playerId] || [];
                  const swappablePositions = eligible.filter((pos) => pos !== player.position);

                  return (
                    <tr key={player.playerId || `${player.playerName}-${player.position}-${player.amountPaid}`}>
                      <td>{player.playerName || "Unknown"}</td>
                      <td>
                        {swappablePositions.length > 0 ? (
                          <select
                            className="position-swap-select"
                            value={player.position || ""}
                            disabled={swappingPlayerId === player.playerId}
                            onChange={(e) => handleSwapPosition(player.playerId, e.target.value)}
                            aria-label={`Change position for ${player.playerName}`}
                          >
                            <option value={player.position || ""}>{player.position || "--"}</option>
                            {swappablePositions.map((pos) => (
                              <option key={pos} value={pos}>{pos}</option>
                            ))}
                          </select>
                        ) : (
                          <span>{player.position || "--"}</span>
                        )}
                      </td>
                      <td>{formatCurrency(player.amountPaid)}</td>
                      <td>
                        <button
                          className="remove-player-btn"
                          onClick={() => handleRemovePlayer(player.playerId)}
                          disabled={savingPlayerId === player.playerId || swappingPlayerId === player.playerId}
                          aria-label={`Remove ${player.playerName}`}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="team-side-panel">
          <div className="team-card position-card">
            <h3>Position Breakdown</h3>
            {positionSlots.length === 0 ? (
              <p>No draft slot configuration available.</p>
            ) : (
              <ul>
                {positionSlots.map((slot) => {
                  const percentFilled = slot.count ? Math.round((slot.filled / slot.count) * 100) : 0;
                  return (
                    <li key={slot.position}>
                      <div className="position-row">
                        <span className="position-label">{slot.position}</span>
                        <span className="position-count">{slot.filled}/{slot.count}</span>
                      </div>
                      <div className="position-bar-wrapper">
                        <div className="position-bar">
                          <div className="position-bar-fill" style={{ width: `${Math.min(percentFilled, 100)}%` }} />
                        </div>
                        <span className="position-bar-label">{percentFilled}%</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="team-card quick-stats-card">
            <h3>Quick Stats</h3>
            <div className="stat-row">
              <span>Avg Price/Player</span>
              <strong>{formatCurrency(stats.avgPrice)}</strong>
            </div>
            <div className="stat-row">
              <span>Hitters</span>
              <strong>{stats.hitters}</strong>
            </div>
            <div className="stat-row">
              <span>Pitchers</span>
              <strong>{stats.pitchers}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
