import { useContext, useMemo } from "react";
import { DraftContext } from "../context/DraftContext";
import "./DraftHistoryPage.css";

function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function DraftHistoryPage() {
  const { pickHistory, teams } = useContext(DraftContext);

  const teamNameById = useMemo(() => {
    const map = new Map();
    for (const team of teams) {
      if (team?._id) map.set(String(team._id), team.name);
    }
    return map;
  }, [teams]);

  const resolveTeamName = (pick, idField, nameField) => {
    return (
      pick?.[nameField] ||
      teamNameById.get(String(pick?.[idField])) ||
      "Unknown team"
    );
  };

  return (
    <div className="draft-history">
      <div className="draft-history-header">
        <div>
          <h2>Draft History</h2>
          <span className="draft-history-count">
            {pickHistory.length} {pickHistory.length === 1 ? "pick" : "picks"} made
          </span>
        </div>
      </div>

      <table className="draft-history-table">
        <thead>
          <tr>
            <th className="col-pick">#</th>
            <th className="col-player">Player</th>
            <th>Position</th>
            <th>Nominator</th>
            <th>Winning Team</th>
            <th>Price</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {pickHistory.map((pick, index) => (
            <tr key={`${pick.playerId}-${index}`}>
              <td className="col-pick">{index + 1}</td>
              <td className="col-player">{pick.playerName || "Unknown"}</td>
              <td>{pick.position || "—"}</td>
              <td>{resolveTeamName(pick, "nominatorTeamId", "nominatorTeamName")}</td>
              <td>{resolveTeamName(pick, "teamId", "teamName")}</td>
              <td className="col-price">${Number(pick.price || 0).toLocaleString()}</td>
              <td>{formatTimestamp(pick.timestamp)}</td>
            </tr>
          ))}
          {pickHistory.length === 0 && (
            <tr>
              <td colSpan={7} className="draft-history-empty">
                No picks have been made yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
