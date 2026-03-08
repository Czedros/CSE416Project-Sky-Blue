const express = require("express");
const env = require("./config/env");
const { connectMongo } = require("./db/mongo");
const usersRoutes = require("./routes/users.routes");

const app = express();

app.use(express.json());
app.use("/api/users", usersRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  await connectMongo(env.mongodbUri);
  app.listen(env.port, () => {
    console.log(`Client backend listening on port ${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
