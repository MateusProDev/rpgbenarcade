// ========================
// Skills Panel
// ========================
import { useGameStore } from "../store/gameStore";
import { getClassSkills } from "../game/entities/classes";
import { getRemainingCooldown } from "../game/combat";
import "./styles.css";

export function SkillsPanel() {
  const player = useGameStore((s) => s.player);
  const showSkills = useGameStore((s) => s.showSkills);
  const toggleSkills = useGameStore((s) => s.toggleSkills);
  const cooldowns = useGameStore((s) => s.cooldowns);

  if (!showSkills || !player) return null;

  const skills = getClassSkills(player.classType, player.advancedClass);

  return (
    <div className="panel skills-panel">
      <div className="panel-header">
        <h3>⚡ Habilidades</h3>
        <button className="close-btn" onClick={toggleSkills}>✕</button>
      </div>

      <div className="skills-list">
        {skills.map((skill, i) => {
          const cd = getRemainingCooldown(skill.id, cooldowns);
          return (
            <div key={skill.id} className="skill-detail">
              <div className="skill-detail-header">
                <span className="skill-detail-icon">{skill.icon}</span>
                <div>
                  <span className="skill-detail-name">{skill.name}</span>
                  <span className="skill-detail-key">[{i + 1}]</span>
                </div>
              </div>
              <p className="skill-detail-desc">{skill.description}</p>
              <div className="skill-detail-stats">
                {skill.damage > 0 && <span>Dano: {skill.damage}</span>}
                {skill.damage < 0 && <span>Cura: {Math.abs(skill.damage)}</span>}
                {skill.manaCost && <span>Mana: {skill.manaCost}</span>}
                <span>CD: {skill.cooldown / 1000}s</span>
                <span>Alcance: {skill.range}</span>
                <span>Escala: {skill.scaling}</span>
                {skill.areaOfEffect && <span>AoE: {skill.areaOfEffect}</span>}
              </div>
              {cd > 0 && (
                <div className="skill-cd-bar">
                  <div
                    className="skill-cd-fill"
                    style={{
                      width: `${(cd / (skill.cooldown / 1000)) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
