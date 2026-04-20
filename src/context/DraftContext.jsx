import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { fetchDraftById } from "../services/api";
import { AuthContext } from "./AuthContext";

export const DraftContext = createContext();

export function DraftProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [draftedPlayerIds, setDraftedPlayerIds] = useState(new Set());
  const [pickHistory, setPickHistory] = useState([]);
  const [draftId, setDraftId] = useState(null);
  const [teams, setTeams] = useState([]);

  // Seed state from the server whenever the active draft changes
  useEffect(() => {
    if (!user?.activeDraft) {
      setDraftedPlayerIds(new Set());
      setPickHistory([]);
      setDraftId(null);
      setTeams([]);
      return;
    }

    setDraftId(user.activeDraft);

    fetchDraftById(user.activeDraft)
      .then((data) => {
        const picks = data?.draft?.pickHistory || [];
        setPickHistory(picks);
        setDraftedPlayerIds(new Set(picks.map((p) => String(p.playerId))));
        setTeams(Array.isArray(data?.teams) ? data.teams : []);
      })
      .catch(() => {
        setDraftedPlayerIds(new Set());
        setPickHistory([]);
        setTeams([]);
      });
  }, [user?.activeDraft]);

  // Called after a successful draft pick — stores full pick data so undo has everything it needs
  const addPick = useCallback((pick) => {
    setDraftedPlayerIds((prev) => new Set([...prev, String(pick.playerId)]));
    setPickHistory((prev) => [...prev, pick]);
  }, []);

  // Pops the last pick from history and removes the player from the drafted set
  const removeLastPick = useCallback(() => {
    setPickHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setDraftedPlayerIds((ids) => {
        const next = new Set(ids);
        next.delete(String(last.playerId));
        return next;
      });
      return prev.slice(0, -1);
    });
  }, []);

  // Removes a specific player from the drafted set and pick history
  const removePlayer = useCallback((playerId) => {
    setDraftedPlayerIds((prev) => {
      const next = new Set(prev);
      next.delete(String(playerId));
      return next;
    });
    setPickHistory((prev) => prev.filter((pick) => String(pick.playerId) !== String(playerId)));
  }, []);

  return (
    <DraftContext.Provider value={{ draftedPlayerIds, pickHistory, draftId, teams, addPick, removeLastPick, removePlayer }}>
      {children}
    </DraftContext.Provider>
  );
}
