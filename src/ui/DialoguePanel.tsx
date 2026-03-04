// ============================================
// DialoguePanel — RPG-style NPC conversation box
// Appears at the bottom of the screen when talking to an NPC
// ============================================
import { useGameStore } from '@/store/gameStore';

/* ---- NPC type → portrait color + symbol ---- */
const NPC_PORTRAIT: Record<string, { bg: string; border: string; symbol: string }> = {
  merchant:  { bg: '#2a1f0a', border: '#c8a44a', symbol: '🛒' },
  friendly:  { bg: '#0a1a2a', border: '#4a9acc', symbol: '⚔️' },
  blacksmith:{ bg: '#1a0f0a', border: '#cc6633', symbol: '🔨' },
  alchemist: { bg: '#0a1a0f', border: '#44cc88', symbol: '⚗️' },
  carpenter: { bg: '#1a150a', border: '#c8913e', symbol: '🪵' },
  enchanter: { bg: '#120a2a', border: '#8844cc', symbol: '✨' },
  default:   { bg: '#0f1520', border: '#556677', symbol: '💬' },
};

function getPortrait(npcId: string, npcType: string) {
  if (npcId.includes('blacksmith')) return NPC_PORTRAIT.blacksmith;
  if (npcId.includes('alchemist'))  return NPC_PORTRAIT.alchemist;
  if (npcId.includes('carpenter'))  return NPC_PORTRAIT.carpenter;
  if (npcId.includes('enchanter'))  return NPC_PORTRAIT.enchanter;
  return NPC_PORTRAIT[npcType] ?? NPC_PORTRAIT.default;
}

export function DialoguePanel() {
  const dialogue   = useGameStore((s) => s.activeDialogue);
  const advance    = useGameStore((s) => s.advanceDialogue);
  const close      = useGameStore((s) => s.closeDialogue);

  if (!dialogue) return null;

  const { npcId, npcName, npcType, lines, lineIndex } = dialogue;
  const portrait   = getPortrait(npcId, npcType);
  const isLastLine = lineIndex >= lines.length - 1;
  const current    = lines[lineIndex] ?? '';

  return (
    <div
      className="absolute bottom-[68px] left-1/2 -translate-x-1/2 z-40 animate-fade-in"
      style={{ width: 'min(680px, 95vw)' }}
    >
      {/* Outer frame */}
      <div
        className="rounded-lg overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(8, 10, 18, 0.96)',
          border: `2px solid ${portrait.border}`,
          boxShadow: `0 0 24px ${portrait.border}44`,
        }}
      >
        {/* Name banner */}
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            background: `${portrait.bg}cc`,
            borderBottom: `1px solid ${portrait.border}66`,
          }}
        >
          <div className="flex items-center gap-2">
            {/* Portrait icon */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              style={{
                background: portrait.bg,
                border: `2px solid ${portrait.border}`,
                boxShadow: `0 0 8px ${portrait.border}66`,
              }}
            >
              {portrait.symbol}
            </div>
            <span
              className="font-bold text-sm tracking-wide"
              style={{ color: portrait.border }}
            >
              {npcName}
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={close}
            className="text-[11px] px-2 py-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: portrait.border, border: `1px solid ${portrait.border}44` }}
            title="Fechar (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Dialogue text */}
        <div className="px-5 py-4 min-h-[60px] flex items-center">
          <p className="text-[var(--color-text-light)] text-sm leading-relaxed">
            {current}
          </p>
        </div>

        {/* Footer: progress dots + continue hint */}
        <div
          className="flex items-center justify-between px-5 py-2"
          style={{ borderTop: `1px solid ${portrait.border}33` }}
        >
          {/* Line progress dots */}
          <div className="flex gap-1.5">
            {lines.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  background: i === lineIndex ? portrait.border : `${portrait.border}33`,
                  transform: i === lineIndex ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          {/* Continue / close button */}
          <button
            onClick={advance}
            className="flex items-center gap-2 px-3 py-1 rounded text-[11px] font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              background: `${portrait.border}22`,
              border: `1px solid ${portrait.border}66`,
              color: portrait.border,
            }}
          >
            <kbd
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${portrait.border}44` }}
            >
              E
            </kbd>
            {isLastLine ? 'Encerrar' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
