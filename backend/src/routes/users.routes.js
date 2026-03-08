const express = require("express");
const User = require("../models/user.model");

const router = express.Router();

function serializePlayerNotes(playerNotesMap) {
  return Object.fromEntries(playerNotesMap?.entries?.() || []);
}

router.post("/register", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required" });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const user = new User({ username });
    await user.setPassword(password);
    await user.save();

    return res.status(201).json({
      username: user.username,
      playerNotes: serializePlayerNotes(user.playerNotes),
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/:username/notes/:playerId", async (req, res, next) => {
  try {
    const { username, playerId } = req.params;
    const { note } = req.body || {};

    if (typeof note !== "string") {
      return res.status(400).json({ error: "note must be a string" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.playerNotes.set(playerId, { note, updatedAt: new Date() });

    await user.save();

    return res.json({
      username: user.username,
      playerNotes: serializePlayerNotes(user.playerNotes),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
