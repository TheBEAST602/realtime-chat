import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://realtime-chat-urq5.onrender.com");

function App() {
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const endRef = useRef(null);

  useEffect(() => {
    const connect = () => setConnected(true);
    const disconnect = () => setConnected(false);
    const receiveHistory = (history) => {
      setMessages(history || []);
    };

    const receive = (msg) => {
      setMessages((prev) => {
        if (msg?.id && prev.some((item) => item.id === msg.id)) {
          return prev;
        }

        return [...prev, msg];
      });
    };

    socket.on("connect", connect);
    socket.on("disconnect", disconnect);
    socket.on("chat_history", receiveHistory);
    socket.on("chat_message", receive);

    return () => {
      socket.off("connect", connect);
      socket.off("disconnect", disconnect);
      socket.off("chat_history", receiveHistory);
      socket.off("chat_message", receive);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const u = username.trim();
    const m = message.trim();

    if (!u || !m || !connected) return;

    socket.emit("chat_message", {
      username: u,
      message: m,
    });

    setMessage("");
  };

  const time = (date) =>
    date
      ? new Date(date).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <div className="app">
      <div className="glow glow1" />
      <div className="glow glow2" />

      <main className="chat">
        <header className="header">
          <div className="brand">
            <div className="logo">💬</div>
            <div>
              <h1>Chatly</h1>
              <p>Real-time conversations</p>
            </div>
          </div>

          <div className={`status ${connected ? "online" : "offline"}`}>
            <span />
            {connected ? "Online" : "Offline"}
          </div>
        </header>

        <div className="user-area">
          <span>👤</span>
          <input
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <section className="messages">
          {messages.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">💬</div>
              <h2>No messages yet</h2>
              <p>Start a conversation and say hello!</p>
            </div>
          ) : (
            messages.map((item) => {
              const mine = item.username === username.trim();

              return (
                <div
                  key={
                    item.id ||
                    `${item.username}-${item.createdAt}-${item.message}`
                  }
                  className={`message-row ${mine ? "mine" : ""}`}
                >
                  <div className={`bubble ${mine ? "mine" : ""}`}>
                    <div className="name">{item.username}</div>
                    <div className="text">{item.message}</div>
                    <div className="time">
                      {time(item.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={endRef} />
        </section>

        <footer className="composer">
          <input
            placeholder={
              connected ? "Type your message..." : "Connecting..."
            }
            disabled={!connected}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button
            disabled={!connected || !message.trim()}
            onClick={sendMessage}
          >
            Send
            <span>➤</span>
          </button>
        </footer>
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #050816;
        }

        .app {
          min-height: 100vh;
          width: 100%;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: Inter, Arial, sans-serif;
          color: #fff;
          background:
            radial-gradient(circle at 10% 10%, #312e81 0, transparent 35%),
            radial-gradient(circle at 90% 90%, #164e63 0, transparent 35%),
            #050816;
        }

        .glow {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }

        .glow1 {
          width: 220px;
          height: 220px;
          background: #7c3aed;
          opacity: .22;
          top: -80px;
          left: -50px;
        }

        .glow2 {
          width: 260px;
          height: 260px;
          background: #06b6d4;
          opacity: .14;
          bottom: -100px;
          right: -60px;
        }

        .chat {
          width: min(900px, 100%);
          height: min(850px, calc(100vh - 48px));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 26px;
          background: rgba(15,23,42,.82);
          backdrop-filter: blur(25px);
          box-shadow:
            0 30px 100px rgba(0,0,0,.55),
            inset 0 1px rgba(255,255,255,.05);
          position: relative;
          z-index: 2;
        }

        .header {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,.08);
          background: linear-gradient(
            90deg,
            rgba(124,58,237,.18),
            rgba(6,182,212,.05)
          );
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 22px;
          background: linear-gradient(135deg,#8b5cf6,#06b6d4);
          box-shadow: 0 8px 25px rgba(124,58,237,.35);
        }

        h1 {
          margin: 0;
          font-size: 21px;
          letter-spacing: -.5px;
        }

        .brand p {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 12px;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          background: rgba(255,255,255,.05);
        }

        .status span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .online {
          color: #86efac;
        }

        .online span {
          background: #22c55e;
          box-shadow: 0 0 10px #22c55e;
        }

        .offline {
          color: #fca5a5;
        }

        .offline span {
          background: #ef4444;
        }

        .user-area {
          margin: 16px 20px 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 13px;
          background: rgba(255,255,255,.05);
        }

        .user-area input {
          width: 100%;
          padding: 13px 0;
          border: 0;
          outline: 0;
          color: white;
          background: transparent;
          font-size: 14px;
        }

        input::placeholder {
          color: #64748b;
        }

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 18px 20px;
          scrollbar-width: thin;
          scrollbar-color: #475569 transparent;
        }

        .empty {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          color: #94a3b8;
        }

        .empty-icon {
          width: 76px;
          height: 76px;
          display: grid;
          place-items: center;
          border-radius: 24px;
          font-size: 32px;
          margin-bottom: 14px;
          background: linear-gradient(
            135deg,
            rgba(139,92,246,.2),
            rgba(6,182,212,.12)
          );
          border: 1px solid rgba(255,255,255,.08);
        }

        .empty h2 {
          color: white;
          font-size: 18px;
          margin: 0;
        }

        .empty p {
          font-size: 13px;
          margin-top: 7px;
        }

        .message-row {
          display: flex;
          margin-bottom: 13px;
          justify-content: flex-start;
        }

        .message-row.mine {
          justify-content: flex-end;
        }

        .bubble {
          max-width: min(72%, 520px);
          padding: 11px 15px;
          border-radius: 18px 18px 18px 5px;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.08);
        }

        .bubble.mine {
          border: 0;
          border-radius: 18px 18px 5px 18px;
          background: linear-gradient(135deg,#7c3aed,#4f46e5);
          box-shadow: 0 8px 25px rgba(79,70,229,.25);
        }

        .name {
          color: #67e8f9;
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .mine .name {
          color: #ddd6fe;
        }

        .text {
          font-size: 14px;
          line-height: 1.5;
          word-break: break-word;
        }

        .time {
          color: #64748b;
          text-align: right;
          font-size: 10px;
          margin-top: 5px;
        }

        .mine .time {
          color: #c4b5fd;
        }

        .composer {
          display: flex;
          gap: 9px;
          padding: 14px 20px 20px;
          border-top: 1px solid rgba(255,255,255,.08);
          background: rgba(2,6,23,.4);
        }

        .composer input {
          flex: 1;
          min-width: 0;
          padding: 14px 16px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 13px;
          outline: none;
          color: white;
          background: rgba(255,255,255,.06);
          font-size: 14px;
        }

        .composer button {
          border: 0;
          border-radius: 13px;
          padding: 0 20px;
          font-weight: 800;
          color: white;
          background: linear-gradient(135deg,#8b5cf6,#06b6d4);
          box-shadow: 0 8px 25px rgba(99,102,241,.3);
        }

        .composer button span {
          margin-left: 6px;
        }

        .composer button:disabled {
          background: #334155;
          color: #64748b;
          box-shadow: none;
        }

        @media (max-width: 600px) {
          .app {
            padding: 8px;
          }

          .chat {
            height: calc(100vh - 16px);
            border-radius: 18px;
          }

          .header {
            padding: 16px;
          }

          .user-area {
            margin: 12px;
          }

          .messages {
            padding: 12px;
          }

          .bubble {
            max-width: 82%;
          }

          .composer {
            padding: 10px;
          }

          .composer button {
            padding: 0 14px;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
