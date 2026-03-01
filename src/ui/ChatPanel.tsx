// ========================
// Chat Panel
// ========================
import { useState, useRef, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { useChat } from "../hooks/useChat";
import "./styles.css";

export function ChatPanel() {
  const showChat = useGameStore((s) => s.showChat);
  const toggleChat = useGameStore((s) => s.toggleChat);
  const chatMessages = useGameStore((s) => s.chatMessages);
  const { send } = useChat();
  const [input, setInput] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  if (!showChat) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      send(input);
      setInput("");
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="panel chat-panel">
      <div className="panel-header">
        <h3>💬 Chat Global</h3>
        <button className="close-btn" onClick={toggleChat}>✕</button>
      </div>

      <div className="chat-messages">
        {chatMessages.length === 0 && (
          <p className="empty-text">Nenhuma mensagem ainda...</p>
        )}
        {chatMessages.map((msg) => (
          <div key={msg.id} className="chat-msg">
            <span className="chat-time">[{formatTime(msg.timestamp)}]</span>
            <span className="chat-sender">{msg.senderName}:</span>
            <span className="chat-text">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEnd} />
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          maxLength={200}
          className="chat-input"
        />
        <button type="submit" className="btn-send">
          Enviar
        </button>
      </form>
    </div>
  );
}
