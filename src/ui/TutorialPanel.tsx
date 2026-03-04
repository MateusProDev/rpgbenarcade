// ============================================
// TutorialPanel — guided onboarding overlay
// Shows current quest objectives + progress
// ============================================
import { useEffect, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getTutorialQuests, getAllQuests, type QuestDefinition } from '@/data/quests';

const TUTORIAL_QUESTS = getTutorialQuests();
const ALL_QUESTS = getAllQuests();

export function TutorialPanel() {
  const quests = useGameStore((s) => s.quests);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const tutorialDismissed = useGameStore((s) => s.tutorialDismissed);
  const startQuest = useGameStore((s) => s.startQuest);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);
  const dismissTutorial = useGameStore((s) => s.dismissTutorial);
  const player = useGameStore((s) => s.player);

  // Auto-start first tutorial quest
  useEffect(() => {
    if (!player || tutorialDismissed) return;
    if (quests.length === 0 && TUTORIAL_QUESTS.length > 0) {
      startQuest(TUTORIAL_QUESTS[0].id);
      setTutorialStep(0);
    }
  }, [player, tutorialDismissed, quests.length, startQuest, setTutorialStep]);

  // Find current active quest
  const activeQuest = useMemo(() => {
    const active = quests.find((q) => q.status === 'active');
    if (!active) return null;
    const def = ALL_QUESTS.find((q) => q.id === active.questId);
    if (!def) return null;
    return { progress: active, def };
  }, [quests]);

  // Auto-unlock next quest when current completes
  useEffect(() => {
    if (!activeQuest) {
      // Check if there's a next quest to unlock
      const completedIds = new Set(quests.filter((q) => q.status === 'completed').map((q) => q.questId));
      for (const questDef of ALL_QUESTS) {
        if (completedIds.has(questDef.id)) continue;
        if (quests.some((q) => q.questId === questDef.id)) continue;
        // Check prerequisites
        const prereqsMet = questDef.prerequisites.every((pid: string) => completedIds.has(pid));
        if (prereqsMet) {
          startQuest(questDef.id);
          break;
        }
      }
    }
  }, [activeQuest, quests, startQuest]);

  if (tutorialDismissed || !activeQuest) return null;

  const { def, progress } = activeQuest;

  return (
    <div className="absolute bottom-[72px] right-3 z-20 animate-fade-in max-w-[260px]">
      <div className="glass-panel p-3 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{def.icon}</span>
            <div>
              <h3 className="text-gold-accent font-bold text-xs uppercase tracking-wide">
                {def.isTutorial ? 'Tutorial' : 'Missão'}
              </h3>
              <p className="text-text-light text-sm font-semibold">{def.title}</p>
            </div>
          </div>
          <button
            onClick={dismissTutorial}
            className="text-text-dim hover:text-text-light text-xs p-1"
            title="Minimizar"
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <p className="text-text-dim text-xs mb-3 leading-relaxed">
          {def.description}
        </p>

        {/* Objectives */}
        <div className="space-y-1.5">
          {def.objectives.map((obj: QuestDefinition['objectives'][number], i: number) => {
            const current = progress.progress[obj.targetId] || 0;
            const done = current >= obj.amount;
            return (
              <div
                key={i}
                className={`flex items-center gap-2 p-1.5 rounded text-xs ${
                  done ? 'bg-green-900/30 text-green-300' : 'bg-black/20 text-text-dim'
                }`}
              >
                <span className="text-sm">{done ? '✅' : obj.icon}</span>
                <span className="flex-1">
                  {obj.targetName}
                </span>
                <span className="font-mono text-[10px]">
                  {Math.min(current, obj.amount)}/{obj.amount}
                </span>
              </div>
            );
          })}
        </div>

        {/* Rewards preview */}
        <div className="mt-3 pt-2 border-t border-white/5">
          <p className="text-text-dim text-[10px] uppercase tracking-wider mb-1">
            Recompensas
          </p>
          <div className="flex gap-3 text-xs">
            {def.rewards.xp > 0 && (
              <span className="text-xp">⭐ {def.rewards.xp} XP</span>
            )}
            {def.rewards.gold > 0 && (
              <span className="text-gold-accent">🪙 {def.rewards.gold}</span>
            )}
            {def.rewards.items?.map((item: { itemId: string; quantity: number }, i: number) => (
              <span key={i} className="text-text-light">
                📦 {item.quantity}x
              </span>
            ))}
          </div>
        </div>

        {/* Step indicator for tutorial */}
        {def.isTutorial && (
          <div className="mt-2 flex gap-1">
            {TUTORIAL_QUESTS.map((_: QuestDefinition, i: number) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i < tutorialStep ? 'bg-green-500'
                    : i === tutorialStep ? 'bg-gold-accent'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
