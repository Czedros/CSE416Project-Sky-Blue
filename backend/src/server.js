const express = require("express");
const env = require("./config/env");
const { connectMongo } = require("./db/mongo");
const { requireAppClientKey } = require("./middleware/auth");
const playerRoutes = require("./routes/player-routes");

const app = express();

app.use(express.json());

app.use("/api/player", requireAppClientKey, playerRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  await connectMongo(env.mongodbUri);
  app.listen(env.port, () => {
    console.log(`DraftKit API listening on port ${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
