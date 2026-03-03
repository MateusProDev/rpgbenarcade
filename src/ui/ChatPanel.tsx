// ============================================
// Chat Panel — global / local / alliance chat
// ============================================
import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { ChatMessage } from '@/store/types';

const CHANNELS = ['global', 'local', 'alliance', 'system'] as const;
type Channel = (typeof CHANNELS)[number];

const CHANNEL_COLORS: Record<Channel, string> = {
  global: 'var(--color-text-light)',
  local: 'var(--color-accent-green)',
  alliance: 'var(--color-accent-purple)',
  system: 'var(--color-gold-accent)',
};

const CHANNEL_LABELS: Record<Channel, string> = {
  global: '🌐 Global',
  local: '📍 Local',
  alliance: '👥 Aliança',
  system: '⚙️ Sistema',
};

export function ChatPanel() {
  const chatOpen = useGameStore((s) => s.ui.chatOpen);
  const toggleChat = useGameStore((s) => s.toggleChat);
  const messages = useGameStore((s) => s.chatMessages);
  const addChatMessage = useGameStore((s) => s.addChatMessage);
  const player = useGameStore((s) => s.player);

  const [input, setInput] = useState('');
  const [activeChannel, setActiveChannel] = useState<Channel>('global');
  const [filterChannel, setFilterChannel] = useState<Channel | 'all'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const filteredMessages = filterChannel === 'all'
    ? messages
    : messages.filter((m) => m.channel === filterChannel);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !player) return;

    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderId: player.uid,
      senderName: player.name,
      text,
      channel: activeChannel,
      timestamp: Date.now(),
    };

    addChatMessage(msg);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    // Stop propagation so game input doesn't fire
    e.stopPropagation();
  };

  // Collapsed: show toggle button only
  if (!chatOpen) {
    return (
      <button
        onClick={toggleChat}
        className="absolute bottom-20 right-3 z-10 glass-panel w-10 h-10 flex items-center justify-center text-lg hover:bg-[var(--color-glow-gold)] transition-all active:scale-95"
        title="Abrir chat (Enter)"
      >
        💬
      </button>
    );
  }

  return (
    <div className="absolute bottom-20 right-3 z-10 animate-fade-in w-80">
      <div className="glass-panel flex flex-col h-72">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--color-border-dim)]">
          <span className="text-xs text-[var(--color-gold-accent)] font-bold">Chat</span>

          {/* Channel filter tabs */}
          <div className="flex gap-1">
            <FilterTab label="Todos" active={filterChannel === 'all'} onClick={() => setFilterChannel('all')} />
            {CHANNELS.map((ch) => (
              <FilterTab
                key={ch}
                label={ch[0].toUpperCase()}
                active={filterChannel === ch}
                onClick={() => setFilterChannel(ch)}
                color={CHANNEL_COLORS[ch]}
              />
            ))}
          </div>

          <button
            onClick={toggleChat}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text-light)] text-sm ml-1"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {filteredMessages.length === 0 ? (
            <p className="text-[var(--color-text-dim)] text-xs text-center mt-8">
              Nenhuma mensagem ainda...
            </p>
          ) : (
            filteredMessages.map((msg) => (
              <ChatBubble key={msg.id} msg={msg} isOwn={msg.senderId === player?.uid} />
            ))
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[var(--color-border-dim)] p-2 flex gap-1.5">
          {/* Channel selector */}
          <select
            value={activeChannel}
            onChange={(e) => setActiveChannel(e.target.value as Channel)}
            className="bg-transparent text-[10px] text-[var(--color-text-dim)] border border-[var(--color-border-dim)] rounded px-1 outline-none cursor-pointer"
          >
            {CHANNELS.filter((c) => c !== 'system').map((ch) => (
              <option key={ch} value={ch} className="bg-[var(--color-bg-dark)]">
                {CHANNEL_LABELS[ch]}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mensagem..."
            maxLength={200}
            className="flex-1 bg-transparent text-sm text-[var(--color-text-light)] placeholder:text-[var(--color-text-dim)] outline-none border-b border-[var(--color-border-dim)] focus:border-[var(--color-gold-accent)] transition-colors px-1"
          />

          <button
            onClick={handleSend}
            className="text-[var(--color-gold-accent)] hover:text-white text-sm px-2 transition-colors"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Chat message bubble ---- */
function ChatBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  const color = CHANNEL_COLORS[msg.channel as Channel] ?? 'var(--color-text-light)';
  const time = new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`text-xs leading-relaxed ${isOwn ? 'text-right' : ''}`}>
      <span className="text-[10px] text-[var(--color-text-dim)]">[{time}] </span>
      {msg.channel === 'system' ? (
        <span style={{ color }} className="italic">{msg.text}</span>
      ) : (
        <>
          <span style={{ color }} className="font-bold">{msg.senderName}: </span>
          <span className="text-[var(--color-text-light)]">{msg.text}</span>
        </>
      )}
    </div>
  );
}

/* ---- Filter tab ---- */
function FilterTab({
  label, active, onClick, color,
}: {
  label: string; active: boolean; onClick: () => void; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[9px] px-1.5 py-0.5 rounded transition-all ${
        active
          ? 'bg-[var(--color-glow-gold)] text-[var(--color-gold-accent)]'
          : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-light)]'
      }`}
      style={!active && color ? { color } : undefined}
    >
      {label}
    </button>
  );
}
