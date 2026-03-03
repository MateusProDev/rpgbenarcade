// ============================================
// Combat Manager — attack logic, skill execution, anime effects
// ============================================
import { useGameStore } from '@/store/gameStore';
import { distance } from '../Physics';
import { input } from '../InputManager';
import { SKILL_DEFS } from '@/data/skills';
import { apiAttack } from '@/services/api';
import type { GameEngine } from '../GameEngine';
import type { Vec2, SkillDefinition, CombatEvent } from '@/store/types';

const SKILL_KEYS = ['skill1', 'skill2', 'skill3', 'skill4', 'skill5'] as const;
const MELEE_RANGE = 50;

/** Direction angle from key */
function dirAngle(dir: string): number {
  switch (dir) {
    case 'up': return -Math.PI / 2;
    case 'down': return Math.PI / 2;
    case 'left': return Math.PI;
    case 'right': return 0;
    default: return 0;
  }
}

export class CombatManager {
  private engine: GameEngine;
  private castTimer = 0;
  private casting = false;
  private globalCd = 0;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  update(dt: number): void {
    if (this.globalCd > 0) this.globalCd -= dt;
    if (this.casting) {
      this.castTimer -= dt;
      if (this.castTimer <= 0) this.casting = false;
    }

    // Check skill inputs
    this.checkSkillInput();

    // Clean old combat events
    useGameStore.getState().clearOldEvents();
  }

  private checkSkillInput(): void {
    if (this.casting || this.globalCd > 0) return;

    const state = useGameStore.getState();
    const player = state.player;
    if (!player) return;

    for (let i = 0; i < SKILL_KEYS.length; i++) {
      if (input.wasPressed(SKILL_KEYS[i])) {
        const skillId = player.equippedSkills[i];
        if (!skillId) continue;

        const skill = SKILL_DEFS[skillId];
        if (!skill) continue;

        if (!state.isSkillReady(skillId)) continue;
        if (player.stats.mana < skill.manaCost) continue;

        this.executeSkill(skill);
        break;
      }
    }

    // Basic attack on mouse click
    if (input.isMouseDown() && this.globalCd <= 0) {
      this.basicAttack();
    }
  }

  private basicAttack(): void {
    const state = useGameStore.getState();
    const player = state.player;
    if (!player) return;

    const pos = this.engine.entities.getLocalPlayerPos();
    if (!pos) return;

    const dir = this.engine.entities.getLocalDir();
    const angle = dirAngle(dir);

    // Visual
    this.engine.effects.showSlash(pos, angle, 0xffffff);
    this.engine.effects.showImpactFlash(
      {
        x: pos.x + Math.cos(angle) * 25,
        y: pos.y + Math.sin(angle) * 25,
      },
      0xffffff,
    );

    // Find nearest target in range
    const target = this.findTarget(pos, MELEE_RANGE, dir);
    if (target) {
      this.applyDamage(target.uid, target.pos, player.stats.attack, false);
    }

    this.globalCd = 0.4;
    this.engine.camera.shake(3, 0.1);
  }

  private executeSkill(skill: SkillDefinition): void {
    const state = useGameStore.getState();
    const player = state.player;
    if (!player) return;

    const pos = this.engine.entities.getLocalPlayerPos();
    if (!pos) return;

    const dir = this.engine.entities.getLocalDir();
    const angle = dirAngle(dir);

    // Consume mana
    state.useMana(skill.manaCost);
    state.setSkillCooldown(skill.id, skill.cooldown);

    // Cast time
    if (skill.castTime > 0) {
      this.casting = true;
      this.castTimer = skill.castTime;
    }

    // Visual effects based on damage type
    const effectPos = {
      x: pos.x + Math.cos(angle) * (skill.range * 0.5),
      y: pos.y + Math.sin(angle) * (skill.range * 0.5),
    };

    switch (skill.damageType) {
      case 'physical':
        this.engine.effects.showSlash(pos, angle, 0xcc4444);
        this.engine.camera.shake(5, 0.15);
        break;
      case 'magical':
        this.engine.effects.showEnergyBurst(effectPos, skill.areaRadius || 30, 0x4488dd);
        this.engine.camera.shake(4, 0.12);
        break;
      case 'true':
        this.engine.effects.showSlash(pos, angle, 0xddaa33);
        this.engine.effects.showEnergyBurst(effectPos, 20, 0xddaa33);
        this.engine.camera.shake(6, 0.2);
        break;
    }

    // Self-heal skills
    if (skill.targetType === 'self') {
      state.heal(skill.baseDamage);
      this.engine.effects.showHeal(pos);
      return;
    }

    // Find targets
    if (skill.targetType === 'area' && skill.areaRadius) {
      // AoE damage
      const targets = this.findTargetsInRadius(effectPos, skill.areaRadius);
      for (const t of targets) {
        this.applyDamage(t.uid, t.pos, skill.baseDamage + player.stats.attack, true);
      }
    } else {
      // Single target
      const target = this.findTarget(pos, skill.range, dir);
      if (target) {
        this.applyDamage(target.uid, target.pos, skill.baseDamage + player.stats.attack, false);
      }
    }

    this.globalCd = 0.5;
  }

  private applyDamage(targetUid: string, targetPos: Vec2, baseDmg: number, isAoe: boolean): void {
    const state = useGameStore.getState();
    const player = state.player;
    if (!player) return;

    // Calculate damage (client prediction)
    const isCrit = Math.random() < player.stats.critRate;
    const damage = Math.floor(
      baseDmg * (isCrit ? player.stats.critDamage : 1) * (0.9 + Math.random() * 0.2),
    );

    // Show VFX
    this.engine.effects.showDamage(targetPos, damage, isCrit);
    this.engine.effects.showImpactFlash(targetPos, isCrit ? 0xffdd33 : 0xff4444);
    this.engine.entities.flashRemote(targetUid, 0xff4444);

    if (isCrit) {
      this.engine.camera.shake(8, 0.2);
    }

    // Send to server for validation
    const pos = this.engine.entities.getLocalPlayerPos() ?? { x: 0, y: 0 };
    apiAttack({
      attackerId: player.uid,
      targetId: targetUid,
      skillId: 'basic',
      attackerPos: pos,
      targetPos,
      zone: state.currentZone,
    }).then((result) => {
      if (result.killed) {
        state.addXp(result.xpGained ?? 0);
        state.addGold(result.goldGained ?? 0);
      }
    }).catch(() => { /* handle server error silently */ });

    // Broadcast combat event
    const event: CombatEvent = {
      type: 'attack',
      attackerId: player.uid,
      targetId: targetUid,
      skillId: 'basic',
      damage,
      isCrit,
      timestamp: Date.now(),
    };
    state.addCombatEvent(event);
  }

  private findTarget(pos: Vec2, range: number, dir: string): { uid: string; pos: Vec2 } | null {
    const state = useGameStore.getState();
    const remotes = state.remotePlayers;
    const angle = dirAngle(dir);
    const cone = Math.PI / 3; // 60-degree cone

    let best: { uid: string; pos: Vec2; dist: number } | null = null;

    for (const [uid, rp] of Object.entries(remotes)) {
      const rPos = { x: rp.x, y: rp.y };
      const d = distance(pos, rPos);
      if (d > range) continue;

      // Check direction cone
      const toTarget = Math.atan2(rPos.y - pos.y, rPos.x - pos.x);
      let angleDiff = Math.abs(toTarget - angle);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      if (angleDiff > cone) continue;

      if (!best || d < best.dist) {
        best = { uid, pos: rPos, dist: d };
      }
    }

    return best;
  }

  private findTargetsInRadius(center: Vec2, radius: number): { uid: string; pos: Vec2 }[] {
    const state = useGameStore.getState();
    const remotes = state.remotePlayers;
    const targets: { uid: string; pos: Vec2 }[] = [];

    for (const [uid, rp] of Object.entries(remotes)) {
      const rPos = { x: rp.x, y: rp.y };
      if (distance(center, rPos) <= radius) {
        targets.push({ uid, pos: rPos });
      }
    }

    return targets;
  }
}
