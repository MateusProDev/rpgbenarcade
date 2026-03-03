// ========================
// Conflict Zone HUD — PvP Strategic Map Overlay
// Bottom bar: Skills, Itens, Missões, Guilda, PvP, Loot
// Top: "Zona de Conflito" banner
// Top right: Alliance dominance panel + minimap
// Alliance dominance visual system
// ========================
import { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import {
  ALLIANCES,
  CONFLICT_STRUCTURES,
  getAllianceScores,
  checkFullDominance,
  getDominantAlliance,
} from "../game/entities/alliances";
import type { AllianceId, ConflictStructure } from "../types";
import "./conflictZone.css";

// Simulated alliance state (in a real game this comes from Firebase)
const useAllianceState = () => {
  const [structures, setStructures] = useState<ConflictStructure[]>(
    () => JSON.parse(JSON.stringify(CONFLICT_STRUCTURES))
  );

  useEffect(() => {
    // Simulate periodic ownership changes for demo flavor
    const interval = setInterval(() => {
      setStructures((prev) => {
        const copy = prev.map((s) => ({ ...s }));
        // Randomly flip one base ownership (not fortress) every 30s
        const bases = copy.filter((s) => s.type === "base");
        const target = bases[Math.floor(Math.random() * bases.length)];
        const alliances: AllianceId[] = ["red", "blue", "green", "purple"];
        target.owner = alliances[Math.floor(Math.random() * alliances.length)];
        return copy;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return { structures, setStructures };
};

export function ConflictZoneHUD() {
  const player = useGameStore((s) => s.player);
  const currentMap = useGameStore((s) => s.currentMap);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const toggleSkills = useGameStore((s) => s.toggleSkills);
  const toggleQuests = useGameStore((s) => s.toggleQuests);
  const toggleGuild = useGameStore((s) => s.toggleGuild);

  const { structures } = useAllianceState();

  if (!player || currentMap !== "conflict_zone") return null;

  const scores = getAllianceScores(structures);
  const fullDominance = checkFullDominance(structures);
  const dominant = getDominantAlliance(structures);

  const dominantAlliance = dominant ? ALLIANCES[dominant] : null;
  const isFull = fullDominance !== null;

  return (
    <>
      {/* Full Dominance Overlay — color tint across screen */}
      {isFull && fullDominance && (
        <div
          className="cz-dominance-overlay"
          style={{
            backgroundColor: ALLIANCES[fullDominance].cssColor,
          }}
        />
      )}

      {/* Top Banner — "Zona de Conflito" */}
      <div className="cz-top-banner">
        <div className="cz-banner-frame">
          <span className="cz-banner-icon">⚔️</span>
          <span className="cz-banner-title">ZONA DE CONFLITO</span>
          <span className="cz-banner-icon">⚔️</span>
        </div>
        {isFull && fullDominance && (
          <div className="cz-dominance-announcement" style={{ color: ALLIANCES[fullDominance].cssColor }}>
            {ALLIANCES[fullDominance].icon} {ALLIANCES[fullDominance].name} DOMINA O REINO! {ALLIANCES[fullDominance].icon}
          </div>
        )}
      </div>

      {/* Top Right — Alliance Dominance Panel */}
      <div className="cz-alliance-panel">
        <div className="cz-panel-header">
          {dominantAlliance ? (
            <>
              <span className="cz-panel-icon">{dominantAlliance.icon}</span>
              <span className="cz-panel-name" style={{ color: dominantAlliance.cssColor }}>
                {dominantAlliance.name}
              </span>
            </>
          ) : (
            <span className="cz-panel-name" style={{ color: "#999" }}>Sem Dominante</span>
          )}
        </div>
        <div className="cz-scores">
          {(Object.keys(ALLIANCES) as AllianceId[]).map((id) => (
            <div key={id} className="cz-score-row">
              <span className="cz-score-icon">{ALLIANCES[id].icon}</span>
              <span className="cz-score-name" style={{ color: ALLIANCES[id].cssColor }}>
                {ALLIANCES[id].name}
              </span>
              <span className="cz-score-value">{scores[id]}/5</span>
            </div>
          ))}
        </div>

        {/* Mini Structures Map */}
        <div className="cz-mini-map">
          <div className="cz-mini-map-bg">
            {structures.map((s) => {
              const mx = (s.x / 19200) * 100;
              const my = (s.y / 19200) * 100;
              return (
                <div
                  key={s.id}
                  className={`cz-mini-marker ${s.type}`}
                  style={{
                    left: `${mx}%`,
                    top: `${my}%`,
                    backgroundColor: s.owner ? ALLIANCES[s.owner].cssColor : "#666",
                    boxShadow: s.type === "fortress"
                      ? `0 0 8px ${s.owner ? ALLIANCES[s.owner].cssColor : "#8833cc"}`
                      : "none",
                  }}
                  title={`${s.name} — ${s.owner ? ALLIANCES[s.owner].name : "Sem dono"}`}
                />
              );
            })}
            {/* Quadrant dividers */}
            <div className="cz-mini-divider-h" />
            <div className="cz-mini-divider-v" />
          </div>
        </div>
      </div>

      {/* Bottom Bar — Medieval styled action buttons */}
      <div className="cz-bottom-bar">
        <div className="cz-bar-frame">
          <button className="cz-bar-btn" onClick={() => toggleSkills()}>
            <span className="cz-btn-icon">⚡</span>
            <span className="cz-btn-label">Skills</span>
          </button>
          <button className="cz-bar-btn" onClick={() => toggleInventory()}>
            <span className="cz-btn-icon">🎒</span>
            <span className="cz-btn-label">Itens</span>
          </button>
          <button className="cz-bar-btn" onClick={() => toggleQuests()}>
            <span className="cz-btn-icon">📜</span>
            <span className="cz-btn-label">Missões</span>
          </button>
          <button className="cz-bar-btn" onClick={() => toggleGuild()}>
            <span className="cz-btn-icon">🏰</span>
            <span className="cz-btn-label">Guilda</span>
          </button>
          <button className="cz-bar-btn cz-btn-pvp">
            <span className="cz-btn-icon">⚔️</span>
            <span className="cz-btn-label">PvP</span>
          </button>
          <button className="cz-bar-btn">
            <span className="cz-btn-icon">💎</span>
            <span className="cz-btn-label">Loot</span>
          </button>
        </div>
      </div>
    </>
  );
}
