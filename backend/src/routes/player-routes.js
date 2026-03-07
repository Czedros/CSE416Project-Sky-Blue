const express = require("express");
const Player = require("../models/player.model");
const { fetchMockExternalPlayer } = require("../services/mockExternalPlayer");

const router = express.Router();

function buildResponse(player, source) {
  return {
    playerId: player.playerId,
    name: player.name,
    team: player.team,
    position: player.position,
    stats: player.stats,
    fetchedAt: new Date(player.fetchedAt).toISOString(),
    source,
  };
}

router.get("/:playerId", async (req, res, next) => {
  try {
    const { playerId } = req.params;

    const cachedPlayer = await Player.findOne({ playerId }).lean();
    if (cachedPlayer) {
      return res.json(buildResponse(cachedPlayer, "cache"));
    }

    const externalPlayer = await fetchMockExternalPlayer(playerId);
    await Player.create(externalPlayer);
    return res.json(buildResponse(externalPlayer, "external"));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
