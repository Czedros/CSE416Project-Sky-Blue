import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { fetchDraftById } from "../services/api";
import { AuthContext } from "./AuthContext";

export const DraftContext = createContext();

export function DraftProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [draftedPlayerIds, setDraftedPlayerIds] = useState(new Set());

  // Seed drafted IDs from pickHistory whenever the active draft changes
  useEffect(() => {
    if (!user?.activeDraft) {
      setDraftedPlayerIds(new Set());
      return;
    }

    fetchDraftById(user.activeDraft)
      .then((data) => {
        const picks = data?.draft?.pickHistory || [];
        setDraftedPlayerIds(new Set(picks.map((p) => String(p.playerId))));
      })
      .catch(() => {
        setDraftedPlayerIds(new Set());
      });
  }, [user?.activeDraft]);

  const addDraftedPlayer = useCallback((playerId) => {
    setDraftedPlayerIds((prev) => new Set([...prev, String(playerId)]));
  }, []);

  return (
    <DraftContext.Provider value={{ draftedPlayerIds, addDraftedPlayer }}>
      {children}
    </DraftContext.Provider>
  );
}
