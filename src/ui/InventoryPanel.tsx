// ============================================
// Inventory Panel — equipment grid, item details, equip/use
// ============================================
import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ITEM_TEMPLATES } from '@/data/items';
import type { InventoryItem, ItemRarity, ItemSlot } from '@/store/types';

const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#aaaaaa',
  uncommon: '#44bb66',
  rare: '#4488dd',
  epic: '#9966cc',
  legendary: '#ddaa33',
};

const RARITY_LABELS: Record<ItemRarity, string> = {
  common: 'Comum',
  uncommon: 'Incomum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};

const SLOT_LABELS: Record<ItemSlot, string> = {
  weapon: '⚔️ Arma',
  armor: '🛡️ Armadura',
  helmet: '⛑️ Elmo',
  boots: '👢 Botas',
  accessory: '💍 Acessório',
  consumable: '🧪 Consumível',
};

type FilterSlot = ItemSlot | 'all';

export function InventoryPanel() {
  const player = useGameStore((s) => s.player);
  const openPanel = useGameStore((s) => s.openPanel);
  const removeItem = useGameStore((s) => s.removeItem);
  const heal = useGameStore((s) => s.heal);

  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [filterSlot, setFilterSlot] = useState<FilterSlot>('all');

  if (!player) return null;

  const inventory = player.inventory;
  const filtered = filterSlot === 'all'
    ? inventory
    : inventory.filter((i) => i.slot === filterSlot);

  const handleUse = (item: InventoryItem) => {
    if (item.slot !== 'consumable') return;
    const template = ITEM_TEMPLATES[item.templateId];
    if (!template) return;

    // Apply consumable effects
    if (template.stats?.hp) heal(template.stats.hp);
    // Mana handled similarly
    if (template.stats?.mana) {
      useGameStore.getState().useMana(-template.stats.mana); // negative = restore
    }

    removeItem(item.id, 1);
    if (item.quantity <= 1) setSelected(null);
  };

  const handleEquip = (item: InventoryItem) => {
    if (item.slot === 'consumable') return;
    const state = useGameStore.getState();
    const p = state.player;
    if (!p) return;

    // Toggle equip
    const updatedInv = p.inventory.map((i) => {
      if (i.id === item.id) return { ...i, equipped: !i.equipped };
      // Unequip items in same slot
      if (i.slot === item.slot && i.equipped && i.id !== item.id) return { ...i, equipped: false };
      return i;
    });

    state.setPlayer({ ...p, inventory: updatedInv });
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="glass-panel w-[520px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-dim)]">
          <h2 className="text-sm font-bold text-[var(--color-gold-accent)]">🎒 Inventário</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--color-text-dim)]">
              {inventory.length} itens · 🪙 {player.gold}
            </span>
            <button
              onClick={() => openPanel(null)}
              className="text-[var(--color-text-dim)] hover:text-[var(--color-accent-red)] text-sm transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-[var(--color-border-dim)]">
          <SlotFilter label="Todos" active={filterSlot === 'all'} onClick={() => setFilterSlot('all')} />
          {(['weapon', 'armor', 'helmet', 'boots', 'accessory', 'consumable'] as ItemSlot[]).map((slot) => (
            <SlotFilter
              key={slot}
              label={SLOT_LABELS[slot].split(' ')[0]}
              active={filterSlot === slot}
              onClick={() => setFilterSlot(slot)}
            />
          ))}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Item grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {filtered.length === 0 ? (
              <p className="text-[var(--color-text-dim)] text-xs text-center mt-8">
                Nenhum item encontrado.
              </p>
            ) : (
              <div className="grid grid-cols-6 gap-1.5">
                {filtered.map((item) => (
                  <ItemSlotCell
                    key={item.id}
                    item={item}
                    isSelected={selected?.id === item.id}
                    onClick={() => setSelected(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Item detail sidebar */}
          <div className="w-48 border-l border-[var(--color-border-dim)] p-3 overflow-y-auto">
            {selected ? (
              <ItemDetail
                item={selected}
                onUse={() => handleUse(selected)}
                onEquip={() => handleEquip(selected)}
              />
            ) : (
              <p className="text-[var(--color-text-dim)] text-xs text-center mt-8">
                Selecione um item
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Item cell in grid ---- */
function ItemSlotCell({
  item, isSelected, onClick,
}: {
  item: InventoryItem; isSelected: boolean; onClick: () => void;
}) {
  const rarityColor = RARITY_COLORS[item.rarity];
  return (
    <button
      onClick={onClick}
      className={`relative w-full aspect-square rounded-lg border flex flex-col items-center justify-center text-base transition-all hover:scale-105 active:scale-95 ${
        isSelected
          ? 'border-[var(--color-gold-accent)] bg-[var(--color-glow-gold)]'
          : 'border-[var(--color-border-dim)] hover:border-[var(--color-border-gold)]'
      } ${item.equipped ? 'ring-1 ring-[var(--color-accent-green)]' : ''}`}
    >
      {/* Icon */}
      <span className="text-lg">{ITEM_TEMPLATES[item.templateId]?.icon ?? '❓'}</span>

      {/* Quantity badge */}
      {item.quantity > 1 && (
        <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-[var(--color-text-light)]">
          {item.quantity}
        </span>
      )}

      {/* Equipped badge */}
      {item.equipped && (
        <span className="absolute top-0.5 right-0.5 text-[8px] text-[var(--color-accent-green)]">E</span>
      )}

      {/* Rarity bar */}
      <div
        className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full"
        style={{ background: rarityColor }}
      />
    </button>
  );
}

/* ---- Item detail view ---- */
function ItemDetail({
  item, onUse, onEquip,
}: {
  item: InventoryItem; onUse: () => void; onEquip: () => void;
}) {
  const template = ITEM_TEMPLATES[item.templateId];
  const rarityColor = RARITY_COLORS[item.rarity];

  return (
    <div className="space-y-2">
      {/* Name */}
      <div className="text-sm font-bold" style={{ color: rarityColor }}>
        {template?.icon ?? '❓'} {item.name}
      </div>

      {/* Rarity + Slot */}
      <div className="flex items-center gap-2 text-[10px]">
        <span style={{ color: rarityColor }}>{RARITY_LABELS[item.rarity]}</span>
        <span className="text-[var(--color-text-dim)]">{SLOT_LABELS[item.slot]}</span>
      </div>

      {/* Description */}
      {template?.description && (
        <p className="text-[11px] text-[var(--color-text-dim)] leading-relaxed">
          {template.description}
        </p>
      )}

      {/* Stats */}
      {item.stats && Object.keys(item.stats).length > 0 && (
        <div className="space-y-0.5 mt-1">
          {Object.entries(item.stats).map(([key, value]) => (
            <div key={key} className="flex justify-between text-[10px]">
              <span className="text-[var(--color-text-dim)] capitalize">{key}</span>
              <span className={value > 0 ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}>
                {value > 0 ? '+' : ''}{value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quantity */}
      <div className="text-[10px] text-[var(--color-text-dim)]">
        Quantidade: {item.quantity}
      </div>

      {/* Price */}
      {template && (
        <div className="text-[10px] text-[var(--color-text-dim)]">
          💰 Valor: {template.price} ouro
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-1.5 mt-2">
        {item.slot === 'consumable' ? (
          <button
            onClick={onUse}
            className="w-full py-1.5 text-xs font-bold rounded bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] border border-[var(--color-accent-green)]/30 hover:bg-[var(--color-accent-green)]/30 transition-colors"
          >
            Usar
          </button>
        ) : (
          <button
            onClick={onEquip}
            className={`w-full py-1.5 text-xs font-bold rounded border transition-colors ${
              item.equipped
                ? 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)] border-[var(--color-accent-red)]/30 hover:bg-[var(--color-accent-red)]/30'
                : 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] border-[var(--color-accent-blue)]/30 hover:bg-[var(--color-accent-blue)]/30'
            }`}
          >
            {item.equipped ? 'Desequipar' : 'Equipar'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---- Slot filter tab ---- */
function SlotFilter({
  label, active, onClick,
}: {
  label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] px-2 py-0.5 rounded transition-all ${
        active
          ? 'bg-[var(--color-glow-gold)] text-[var(--color-gold-accent)]'
          : 'text-[var(--color-text-dim)] hover:text-[var(--color-text-light)]'
      }`}
    >
      {label}
    </button>
  );
}
