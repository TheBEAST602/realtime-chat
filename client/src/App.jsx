import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io();

function App() {
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleMessage = (newMessage) => {
      setMessages((currentMessages) => [
        ...currentMessages,
        newMessage,
      ]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("chat_message", handleMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("chat_message", handleMessage);
    };
  }, []);

  const sendMessage = () => {
    if (!username.trim() || !message.trim()) {
      return;
    }

    socket.emit("chat_message", {
      username: username.trim(),
      message: message.trim(),
    });

    setMessage("");
  };

  return (
    <div>
      <h1>Real Time Chat</h1>

      <p>
        Server: {connected ? "Connected ✅" : "Disconnected ❌"}
      </p>

      <input
        type="text"
        placeholder="Your username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            sendMessage();
          }
        }}
      />

      <button onClick={sendMessage}>Send</button>

      <h2>Messages</h2>

      {messages.map((item, index) => (
        <p key={index}>
          <strong>{item.username}:</strong> {item.message}
        </p>
      ))}
    </div>
  );
}

export default App;
