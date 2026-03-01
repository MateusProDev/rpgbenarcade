// ========================
// Inventory Panel
// ========================
import { useGameStore } from "../store/gameStore";
import type { Item, EquipSlot } from "../types";
import "./styles.css";

export function InventoryPanel() {
  const player = useGameStore((s) => s.player);
  const showInventory = useGameStore((s) => s.showInventory);
  const toggleInventory = useGameStore((s) => s.toggleInventory);
  const equipItem = useGameStore((s) => s.equipItem);
  const unequipItem = useGameStore((s) => s.unequipItem);
  const removeItem = useGameStore((s) => s.removeItem);
  const heal = useGameStore((s) => s.heal);
  const restoreMana = useGameStore((s) => s.restoreMana);
  const addNotification = useGameStore((s) => s.addNotification);

  if (!showInventory || !player) return null;

  const handleUseItem = (item: Item) => {
    if (item.type === "consumable") {
      if (item.id === "health_potion") {
        heal(50);
        addNotification("Usou Poção de Vida (+50 HP)");
      } else if (item.id === "greater_health_potion") {
        heal(120);
        addNotification("Usou Poção de Vida Superior (+120 HP)");
      } else if (item.id === "mana_potion") {
        restoreMana(40);
        addNotification("Usou Poção de Mana (+40 Mana)");
      } else if (item.id === "elixir_of_strength") {
        addNotification("Usou Elixir de Força!");
      }
      removeItem(item.id);
    } else if (item.equipSlot) {
      equipItem(item);
      addNotification(`Equipou: ${item.name}`);
    }
  };

  const handleUnequip = (slot: EquipSlot) => {
    unequipItem(slot);
    addNotification("Item desequipado");
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "#aaaaaa";
      case "rare": return "#4488ff";
      case "epic": return "#aa44ff";
      case "legendary": return "#ffaa00";
      default: return "#ffffff";
    }
  };

  return (
    <div className="panel inventory-panel">
      <div className="panel-header">
        <h3>🎒 Inventário</h3>
        <button className="close-btn" onClick={toggleInventory}>✕</button>
      </div>

      {/* Equipment */}
      <div className="equipment-section">
        <h4>Equipamento</h4>
        <div className="equipment-grid">
          {(["weapon", "head", "body", "legs", "accessory"] as EquipSlot[]).map(
            (slot) => {
              const equipped = player.equipment[slot];
              return (
                <div
                  key={slot}
                  className="equip-slot"
                  onClick={() => equipped && handleUnequip(slot)}
                  title={equipped ? `${equipped.name}\nClique para desequipar` : `Vazio (${slot})`}
                >
                  {equipped ? (
                    <span
                      className="equip-icon"
                      style={{ color: getRarityColor(equipped.rarity) }}
                    >
                      {equipped.icon}
                    </span>
                  ) : (
                    <span className="equip-empty">{getSlotIcon(slot)}</span>
                  )}
                  <span className="equip-label">{getSlotName(slot)}</span>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Attributes */}
      <div className="attributes-section">
        <h4>Atributos {player.attributePoints > 0 && `(${player.attributePoints} pts)`}</h4>
        <div className="attr-grid">
          {(["strength", "dexterity", "intelligence", "vitality"] as const).map((attr) => (
            <div key={attr} className="attr-row">
              <span className="attr-name">{getAttrIcon(attr)} {getAttrName(attr)}</span>
              <span className="attr-value">{player.attributes[attr]}</span>
              {player.attributePoints > 0 && (
                <button
                  className="attr-btn"
                  onClick={() => useGameStore.getState().distributeAttribute(attr)}
                >
                  +
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="inventory-grid">
        {player.inventory.length === 0 && (
          <p className="empty-text">Inventário vazio</p>
        )}
        {player.inventory.map((slot, i) => (
          <div
            key={i}
            className="item-slot"
            onClick={() => handleUseItem(slot.item)}
            title={`${slot.item.name}\n${slot.item.description}\n${slot.item.type === "consumable" ? "Clique para usar" : "Clique para equipar"}`}
          >
            <span
              className="item-icon"
              style={{ color: getRarityColor(slot.item.rarity) }}
            >
              {slot.item.icon}
            </span>
            {slot.quantity > 1 && (
              <span className="item-qty">x{slot.quantity}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getSlotIcon(slot: EquipSlot): string {
  switch (slot) {
    case "weapon": return "⚔️";
    case "head": return "⛑️";
    case "body": return "🛡️";
    case "legs": return "👢";
    case "accessory": return "💍";
    default: return "";
  }
}

function getSlotName(slot: EquipSlot): string {
  switch (slot) {
    case "weapon": return "Arma";
    case "head": return "Cabeça";
    case "body": return "Corpo";
    case "legs": return "Pernas";
    case "accessory": return "Acessório";
    default: return slot;
  }
}

function getAttrIcon(attr: string): string {
  switch (attr) {
    case "strength": return "💪";
    case "dexterity": return "🏃";
    case "intelligence": return "🧠";
    case "vitality": return "❤️";
    default: return "";
  }
}

function getAttrName(attr: string): string {
  switch (attr) {
    case "strength": return "Força";
    case "dexterity": return "Destreza";
    case "intelligence": return "Inteligência";
    case "vitality": return "Vitalidade";
    default: return attr;
  }
}
