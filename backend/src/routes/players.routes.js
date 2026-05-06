const express = require("express");
const authMiddleware = require("../middleware/auth");
const env = require("../config/env");
const User = require("../models/user.model");
const Draft = require("../models/draft.model");

const router = express.Router();

router.get("/:playerId/valuation", authMiddleware, async (req, res, next) => {
  try {
    const playerId = String(req.params.playerId || "").trim();
    if (!playerId) {
      return res.status(400).json({ error: "playerId is required" });
    }

    if (!env.draftKitAppClientKey) {
      return res.status(500).json({ error: "Missing DRAFTKIT_APP_CLIENT_KEY on client backend" });
    }

    const user = await User.findById(req.user.id).select("activeDraft");
    if (!user?.activeDraft) {
      return res.status(400).json({ error: "No active draft selected" });
    }

    const draft = await Draft.findById(user.activeDraft).select("numberOfTeams budgetPerTeam rosterSlots pickHistory");
    if (!draft) {
      return res.status(404).json({ error: "Draft not found" });
    }

    const drafted = (draft.pickHistory || [])
      .map((pick) => ({
        playerId: Number(pick.playerId),
        price: Number(pick.price),
        position: pick.position,
      }))
      .filter((p) => Number.isInteger(p.playerId) && Number.isFinite(p.price) && p.price >= 0);

    const base = String(env.draftKitApiUrl || "").replace(/\/+$/, "");
    const url = `${base}/api/players/value`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.draftKitAppClientKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leagueSettings: {
          budget: draft.budgetPerTeam,
          teams: draft.numberOfTeams,
        },
        draftState: {
          playersDrafted: drafted,
        },
        playerIds: [Number(playerId)],
      }),
    });

    const text = await upstream.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json(payload || { error: "Upstream valuation request failed" });
    }

    if (payload && Array.isArray(payload.values)) {
      return res.json(payload.values[0] || {});
    }

    return res.json(payload || {});
  } catch (error) {
    return next(error);
  }
});
// ai generated
router.post("/valuation", authMiddleware, async (req, res, next) => {
  try {
    if (!env.draftKitAppClientKey) {
      return res.status(500).json({ error: "Missing DRAFTKIT_APP_CLIENT_KEY on client backend" });
    }

    const user = await User.findById(req.user.id).select("activeDraft");
    if (!user?.activeDraft) {
      return res.status(400).json({ error: "No active draft selected" });
    }

    const draft = await Draft.findById(user.activeDraft).select("numberOfTeams budgetPerTeam rosterSlots pickHistory");
    if (!draft) {
      return res.status(404).json({ error: "Draft not found" });
    }

    const drafted = (draft.pickHistory || [])
      .map((pick) => ({
        playerId: Number(pick.playerId),
        price: Number(pick.price),
        position: pick.position,
      }))
      .filter((p) => Number.isInteger(p.playerId) && Number.isFinite(p.price) && p.price >= 0);

    const playerIds = Array.isArray(req.body?.playerIds)
      ? req.body.playerIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id))
      : [];

    const base = String(env.draftKitApiUrl || "").replace(/\/+$/, "");
    const path = playerIds.length > 0 ? "/api/players/value" : "/api/players/value/all";
    const url = `${base}${path}`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.draftKitAppClientKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leagueSettings: {
          budget: draft.budgetPerTeam,
          teams: draft.numberOfTeams,
        },
        draftState: {
          playersDrafted: drafted,
        },
        ...(playerIds.length > 0 ? { playerIds } : {}),
      }),
    });

    const text = await upstream.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json(payload || { error: "Upstream valuation request failed" });
    }

    return res.json(payload || []);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

