// ========================
// Shop Panel
// ========================
import { useGameStore } from "../store/gameStore";
import { getItem } from "../game/entities/items";
import type { Item } from "../types";
import "./styles.css";

export function ShopPanel() {
  const player = useGameStore((s) => s.player);
  const showShop = useGameStore((s) => s.showShop);
  const setShowShop = useGameStore((s) => s.setShowShop);
  const addItem = useGameStore((s) => s.addItem);
  const addGold = useGameStore((s) => s.addGold);
  const addNotification = useGameStore((s) => s.addNotification);

  if (!showShop || !player) return null;

  // Default shop items
  const shopItemIds = [
    "rusty_sword", "wooden_bow", "apprentice_staff", "iron_lance",
    "cloth_armor", "iron_helm", "leather_boots",
    "health_potion", "mana_potion", "greater_health_potion",
  ];

  const shopItems = shopItemIds.map(getItem).filter((i): i is Item => !!i);

  const handleBuy = (itemId: string) => {
    const item = getItem(itemId);
    if (!item) return;

    if (player.gold < item.price) {
      addNotification("Gold insuficiente!");
      return;
    }

    addGold(-item.price);
    addItem(item);
    addNotification(`Comprou: ${item.name} por ${item.price} gold`);
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
    <div className="panel shop-panel">
      <div className="panel-header">
        <h3>🏪 Loja</h3>
        <button className="close-btn" onClick={() => setShowShop(false)}>✕</button>
      </div>

      <div className="shop-gold">💰 Seu Gold: {player.gold}</div>

      <div className="shop-grid">
        {shopItems.map((item) => {
          if (!item) return null;
          const canAfford = player.gold >= item.price;
          return (
            <div key={item.id} className={`shop-item ${!canAfford ? "cant-afford" : ""}`}>
              <span
                className="shop-item-icon"
                style={{ color: getRarityColor(item.rarity) }}
              >
                {item.icon}
              </span>
              <div className="shop-item-info">
                <span
                  className="shop-item-name"
                  style={{ color: getRarityColor(item.rarity) }}
                >
                  {item.name}
                </span>
                <span className="shop-item-desc">{item.description}</span>
                <span className="shop-item-price">💰 {item.price}</span>
              </div>
              <button
                className="btn-buy"
                onClick={() => handleBuy(item.id)}
                disabled={!canAfford}
              >
                Comprar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
