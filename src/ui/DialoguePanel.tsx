// ========================
// NPC Dialogue Panel
// ========================
import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import "./styles.css";

export function DialoguePanel() {
  const npcDialogue = useGameStore((s) => s.currentNpcDialogue);
  const setNpcDialogue = useGameStore((s) => s.setNpcDialogue);
  const [lineIndex, setLineIndex] = useState(0);

  if (!npcDialogue) return null;

  const handleNext = () => {
    if (lineIndex < npcDialogue.lines.length - 1) {
      setLineIndex(lineIndex + 1);
    } else {
      setNpcDialogue(null);
      setLineIndex(0);
    }
  };

  return (
    <div className="dialogue-overlay" onClick={handleNext}>
      <div className="dialogue-box">
        <div className="dialogue-name">{npcDialogue.npcName}</div>
        <div className="dialogue-text">{npcDialogue.lines[lineIndex]}</div>
        <div className="dialogue-hint">
          {lineIndex < npcDialogue.lines.length - 1
            ? "Clique para continuar..."
            : "Clique para fechar"}
        </div>
      </div>
    </div>
  );
}
