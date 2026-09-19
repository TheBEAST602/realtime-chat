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
  },
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/", (req, res) => {
  res.send("Chat server is running!");
});

io.on("connection", async (socket) => {
  console.log("A user connected:", socket.id);

  // Send recent messages to the newly connected user.
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

    for (const message of result.rows) {
      socket.emit("chat_message", message);
    }

    console.log(`Loaded ${result.rows.length} messages for ${socket.id}`);
  } catch (error) {
    console.error("Failed to load messages:", error.message);
  }

  socket.on("chat_message", async (data) => {
    const username = String(data?.username || "").trim();
    const message = String(data?.message || "").trim();

    if (!username || !message) {
      return;
    }

    try {
      // Save the message first.
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

      console.log("Message saved:", savedMessage);

      // Then send the saved message to every connected user.
      io.emit("chat_message", savedMessage);
    } catch (error) {
      console.error("Failed to save message:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

pool
  .query("SELECT 1")
  .then(() => {
    console.log("PostgreSQL connected successfully");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("PostgreSQL connection failed:", error.message);
    process.exit(1);
  });
