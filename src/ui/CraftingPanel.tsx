// ============================================
// CraftingPanel — station-based crafting UI
// ============================================
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  CRAFTING_STATIONS,
  CRAFTING_RECIPES,
  getRecipesForStation,
  canCraft,
  type CraftingStation,
  type CraftingRecipe,
} from '@/data/crafting';
import { ITEM_TEMPLATES } from '@/data/items';

export function CraftingPanel() {
  const station = useGameStore((s) => s.activeCraftingStation);
  const closeCraftingStation = useGameStore((s) => s.closeCraftingStation);
  const player = useGameStore((s) => s.player);
  const addItem = useGameStore((s) => s.addItem);
  const removeItem = useGameStore((s) => s.removeItem);
  const addXp = useGameStore((s) => s.addXp);
  const addGold = useGameStore((s) => s.addGold);

  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [crafting, setCrafting] = useState(false);
  const [craftProgress, setCraftProgress] = useState(0);
  const [craftMessage, setCraftMessage] = useState('');

  if (!station || !player) return null;

  const stationDef = CRAFTING_STATIONS[station];
  const recipes = getRecipesForStation(station);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 animate-fade-in">
      <div className="glass-panel w-[520px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{stationDef.icon}</span>
            <div>
              <h2 className="text-text-light font-bold text-lg">{stationDef.name}</h2>
              <p className="text-text-dim text-xs">{stationDef.description}</p>
            </div>
          </div>
          <button
            onClick={closeCraftingStation}
            className="text-text-dim hover:text-text-light text-xl p-2 hover:bg-white/5 rounded"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Recipe List */}
          <div className="w-48 border-r border-white/10 overflow-y-auto p-2">
            <p className="text-text-dim text-[10px] uppercase tracking-wider px-2 py-1">
              Receitas
            </p>
            {recipes.map((recipe) => {
              const available = canCraft(recipe, player.inventory);
              const levelOk = player.level >= recipe.levelReq;
              return (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded text-left text-xs transition-all ${
                    selectedRecipe === recipe.id
                      ? 'bg-gold-accent/20 text-gold-accent'
                      : available && levelOk
                        ? 'hover:bg-white/5 text-text-light'
                        : 'text-text-dim opacity-50'
                  }`}
                >
                  <span className="text-sm">{recipe.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{recipe.name}</p>
                    {!levelOk && (
                      <p className="text-[9px] text-red-400">Lv.{recipe.levelReq}</p>
                    )}
                  </div>
                </button>
              );
            })}

            {recipes.length === 0 && (
              <p className="text-text-dim text-xs p-2 text-center">
                Nenhuma receita disponível
              </p>
            )}
          </div>

          {/* Recipe Detail */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedRecipe ? (
              <RecipeDetail
                recipe={CRAFTING_RECIPES[selectedRecipe]}
                player={player}
                crafting={crafting}
                craftProgress={craftProgress}
                craftMessage={craftMessage}
                onCraft={(recipe) => {
                  if (crafting) return;
                  if (!canCraft(recipe, player.inventory)) return;
                  if (player.level < recipe.levelReq) return;

                  setCrafting(true);
                  setCraftProgress(0);
                  setCraftMessage('');

                  // Simulate craft time with progress
                  const duration = recipe.craftTime * 1000;
                  const start = Date.now();
                  const interval = setInterval(() => {
                    const elapsed = Date.now() - start;
                    const progress = Math.min(1, elapsed / duration);
                    setCraftProgress(progress);

                    if (progress >= 1) {
                      clearInterval(interval);
                      // Remove ingredients
                      for (const ing of recipe.ingredients) {
                        const items = player.inventory.filter((i) => i.templateId === ing.itemId);
                        let needed = ing.quantity;
                        for (const item of items) {
                          if (needed <= 0) break;
                          const take = Math.min(item.quantity, needed);
                          removeItem(item.id, take);
                          needed -= take;
                        }
                      }

                      // Add result item
                      const template = ITEM_TEMPLATES[recipe.result.itemId];
                      if (template) {
                        addItem({
                          id: `${recipe.result.itemId}_${Date.now()}`,
                          templateId: recipe.result.itemId,
                          name: template.name,
                          icon: template.icon,
                          rarity: template.rarity,
                          slot: template.slot,
                          quantity: recipe.result.quantity,
                          stats: template.stats,
                          equipped: false,
                        });
                      }

                      // Give XP
                      addXp(recipe.xpReward);

                      setCrafting(false);
                      setCraftMessage(`✅ ${recipe.name} criado!`);
                      setTimeout(() => setCraftMessage(''), 3000);
                    }
                  }, 50);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-text-dim text-sm">
                <div className="text-center">
                  <span className="text-3xl block mb-2">{stationDef.icon}</span>
                  <p>Selecione uma receita</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Recipe Detail View ---- */
function RecipeDetail({
  recipe,
  player,
  crafting,
  craftProgress,
  craftMessage,
  onCraft,
}: {
  recipe: CraftingRecipe;
  player: NonNullable<ReturnType<typeof useGameStore.getState>['player']>;
  crafting: boolean;
  craftProgress: number;
  craftMessage: string;
  onCraft: (recipe: CraftingRecipe) => void;
}) {
  const available = canCraft(recipe, player.inventory);
  const levelOk = player.level >= recipe.levelReq;

  return (
    <div>
      {/* Name + icon */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{recipe.icon}</span>
        <div>
          <h3 className="text-text-light font-bold text-base">{recipe.name}</h3>
          <p className="text-text-dim text-xs">
            Nível {recipe.levelReq} • ⏱ {recipe.craftTime}s • ⭐ {recipe.xpReward} XP
          </p>
        </div>
      </div>

      {/* Ingredients */}
      <div className="mb-4">
        <p className="text-text-dim text-[10px] uppercase tracking-wider mb-2">
          Ingredientes
        </p>
        <div className="space-y-1">
          {recipe.ingredients.map((ing, i) => {
            const owned = player.inventory
              .filter((item) => item.templateId === ing.itemId)
              .reduce((sum, item) => sum + item.quantity, 0);
            const enough = owned >= ing.quantity;
            const template = ITEM_TEMPLATES[ing.itemId];
            return (
              <div
                key={i}
                className={`flex items-center gap-2 p-2 rounded text-xs ${
                  enough ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'
                }`}
              >
                <span className="text-sm">{template?.icon || '📦'}</span>
                <span className="flex-1">{template?.name || ing.itemId}</span>
                <span className="font-mono">
                  {owned}/{ing.quantity}
                </span>
                {enough ? '✅' : '❌'}
              </div>
            );
          })}
        </div>
      </div>

      {/* Result preview */}
      <div className="mb-4">
        <p className="text-text-dim text-[10px] uppercase tracking-wider mb-2">
          Resultado
        </p>
        <div className="flex items-center gap-2 p-2 rounded bg-gold-accent/10 text-gold-accent text-xs">
          <span className="text-lg">{recipe.icon}</span>
          <span className="flex-1 font-semibold">{recipe.name}</span>
          <span>×{recipe.result.quantity}</span>
        </div>
      </div>

      {/* Craft button + progress */}
      {crafting ? (
        <div className="space-y-2">
          <div className="h-3 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-accent rounded-full transition-all duration-100"
              style={{ width: `${craftProgress * 100}%` }}
            />
          </div>
          <p className="text-text-dim text-xs text-center">
            Criando... {Math.floor(craftProgress * 100)}%
          </p>
        </div>
      ) : (
        <>
          <button
            onClick={() => onCraft(recipe)}
            disabled={!available || !levelOk}
            className={`w-full py-2.5 rounded font-bold text-sm transition-all ${
              available && levelOk
                ? 'bg-gold-accent text-bg-dark hover:bg-gold-accent/80 active:scale-98'
                : 'bg-white/5 text-text-dim cursor-not-allowed'
            }`}
          >
            {!levelOk
              ? `🔒 Requer Nível ${recipe.levelReq}`
              : !available
                ? '❌ Materiais Insuficientes'
                : `⚒️ Criar ${recipe.name}`}
          </button>
          {craftMessage && (
            <p className="text-green-400 text-xs text-center mt-2 animate-fade-in">
              {craftMessage}
            </p>
          )}
        </>
      )}
    </div>
  );
}
