import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPlayers } from "../services/api";
import { DraftContext } from "../context/DraftContext";
import "./HomePage.css";

export default function HomePage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("");
  const navigate = useNavigate();
  const { draftedPlayerIds } = useContext(DraftContext);

  useEffect(() => {
    let cancelled = false;

    async function loadPlayers() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchPlayers();
        if (!cancelled) {
          setPlayers(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Failed to load players");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlayers();

    return () => {
      cancelled = true;
    };
  }, []);

  const allPositions = useMemo(
    () => [...new Set(players.map((p) => p.position).filter(Boolean))].sort(),
    [players]
  );

  const allLeagues = useMemo(
    () => [...new Set(players.map((p) => p.league).filter(Boolean))].sort(),
    [players]
  );

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (draftedPlayerIds.has(String(p.id))) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (posFilter && p.position !== posFilter) return false;
      if (leagueFilter && p.league !== leagueFilter) return false;
      return true;
    });
  }, [players, search, posFilter, leagueFilter, draftedPlayerIds]);

  if (loading) {
    return (
      <div className="home">
        <div className="home-header">
          <h2>Available Players</h2>
        </div>
        <p className="home-count">Loading players...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home">
        <div className="home-header">
          <h2>Available Players</h2>
        </div>
        <p className="home-count">{error}</p>
      </div>
    );
  }

  return (
    <div className="home">
      <div className="home-header">
        <div>
          <h2>Available Players</h2>
          <span className="home-count">{filtered.length} players available</span>
        </div>
      </div>

      <div className="home-toolbar">
        <div className="search-box">
          <svg className="search-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
            <option value="">All Position</option>
            {allPositions.map((pos) => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
          <select value={leagueFilter} onChange={(e) => setLeagueFilter(e.target.value)}>
            <option value="">All League</option>
            {allLeagues.map((lg) => (
              <option key={lg} value={lg}>{lg}</option>
            ))}
          </select>
        </div>
      </div>

      <table className="players-table">
        <thead>
          <tr>
            <th className="col-name">Name</th>
            <th>Position</th>
            <th>Team</th>
            <th>League</th>
            <th>AVG/ERA</th>
            <th>HR/W</th>
            <th>RBI/SV</th>
            <th>SB/K</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id}>
              <td className="col-name">{p.name}</td>
              <td>{p.position}</td>
              <td>{p.team}</td>
              <td>
                <span className={`league-badge ${p.league === "AL" ? "league-al" : "league-nl"}`}>
                  {p.league}
                </span>
              </td>
              <td>{typeof p.avg === "number" ? (p.isPitcher ? p.avg.toFixed(2) : p.avg.toFixed(3)) : "-"}</td>
              <td>{p.hr}</td>
              <td>{p.rbi}</td>
              <td>{p.sb}</td>
              <td>
                <button
                  className="view-btn"
                  onClick={() => navigate(`/player/${encodeURIComponent(String(p.id))}`)}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={9} className="empty-row">No players match your filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
