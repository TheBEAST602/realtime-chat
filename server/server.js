require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Real Time Chat Server",
  });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "healthy",
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
    });
  }
});

io.on("connection", async (socket) => {
  console.log("User connected:", socket.id);

  try {
    const result = await pool.query(`
      SELECT
        "id",
        "username",
        "content" AS "message",
        "createdAt"
      FROM "message"
      ORDER BY "createdAt" ASC
      LIMIT 50
    `);

    socket.emit("chat_history", result.rows);

    console.log(
      `Loaded ${result.rows.length} messages for ${socket.id}`
    );
  } catch (error) {
    console.error(
      "Failed to load message history:",
      error.message
    );

    socket.emit("server_error", {
      message: "Unable to load chat history.",
    });
  }

  socket.on("chat_message", async (data) => {
    const username = String(data?.username || "").trim();
    const message = String(data?.message || "").trim();

    if (!username || !message) {
      socket.emit("server_error", {
        message: "Username and message are required.",
      });
      return;
    }

    if (username.length > 50) {
      socket.emit("server_error", {
        message: "Username is too long.",
      });
      return;
    }

    if (message.length > 2000) {
      socket.emit("server_error", {
        message: "Message is too long.",
      });
      return;
    }

    try {
      const result = await pool.query(
        `
        INSERT INTO "message" ("username", "content")
        VALUES ($1, $2)
        RETURNING
          "id",
          "username",
          "content" AS "message",
          "createdAt"
        `,
        [username, message]
      );

      const savedMessage = result.rows[0];

      console.log(
        `Message saved: ${username}: ${message}`
      );

      io.emit("chat_message", savedMessage);
    } catch (error) {
      console.error(
        "Failed to save message:",
        error.message
      );

      socket.emit("server_error", {
        message: "Message could not be saved.",
      });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `User disconnected: ${socket.id} (${reason})`
    );
  });
});

const PORT = process.env.PORT || 3000;

pool
  .query("SELECT 1")
  .then(() => {
    console.log("PostgreSQL connected successfully");

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(
      "PostgreSQL connection failed:",
      error.message
    );

    process.exit(1);
  });

process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down server...");
  await pool.end();
  process.exit(0);
});
