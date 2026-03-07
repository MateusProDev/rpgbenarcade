import React, { useState, useEffect } from 'react';
import type { Building, BuildingType } from '../../types';
import { BUILDINGS } from '../../modules/buildings/buildingConfig';
import { useBuilding } from '../../hooks/useBuilding';
import { canUpgradeBuilding } from '../../modules/buildings/buildingConfig';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import assets from '../../services/cloudinary';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BuildingCardProps {
  buildingType: BuildingType;
}

export const BuildingCard: React.FC<BuildingCardProps> = ({ buildingType }) => {
  const { castle, upgrade, checkComplete } = useBuilding();
  const building = castle?.buildings[buildingType] as Building | undefined;
  const config   = BUILDINGS[buildingType];
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState('');
  const [now, setNow]         = useState(Date.now());

  // Atualiza relógio a cada segundo
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      if (building?.upgrading && building.upgradeEnds && Date.now() >= building.upgradeEnds) {
        checkComplete(buildingType);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [building?.upgradeEnds, buildingType, checkComplete]);

  if (!castle || !building) return null;

  const nextLevel = building.level + 1;
  const costNext  = nextLevel <= config.maxLevel ? config.costPerLevel(nextLevel) : null;
  const timeNext  = nextLevel <= config.maxLevel ? config.timePerLevel(nextLevel) : 0;
  const { canUpgrade } = canUpgradeBuilding(castle.resources, buildingType, building.level);

  const timeRemaining = building.upgradeEnds ? Math.max(0, building.upgradeEnds - now) : 0;
  const upgradeDuration = nextLevel <= config.maxLevel ? config.timePerLevel(nextLevel) * 1000 : 1;
  const startTime = building.upgradeEnds ? building.upgradeEnds - upgradeDuration : 0;
  const progress = building.upgrading && building.upgradeEnds
    ? ((now - startTime) / upgradeDuration) * 100
    : 0;

  const handleUpgrade = async () => {
    setLoading(true);
    const result = await upgrade(buildingType);
    setMsg(result.message);
    setLoading(false);
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="bg-castle-stone border border-castle-wall rounded-lg p-4 flex flex-col gap-3 hover:border-castle-gold transition-colors">
      <div className="flex items-center gap-3">
        <img
          src={assets.building(buildingType, building.level)}
          onError={(e) => { (e.target as HTMLImageElement).src = assets.placeholder(config.name[0]); }}
          alt={config.name}
          className="w-14 h-14 rounded object-cover bg-castle-dark"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medieval text-parchment-100 font-bold truncate">{config.name}</h3>
          <p className="text-xs text-parchment-400">Nível {building.level}</p>
          <p className="text-xs text-parchment-500 truncate">{config.description}</p>
        </div>
      </div>

      {building.upgrading ? (
        <div className="space-y-1">
          <ProgressBar value={progress} label={`Evoluindo para nível ${building.level + 1}`} />
          <p className="text-xs text-parchment-400 text-center">
            {timeRemaining > 0
              ? `Conclui ${formatDistanceToNow(building.upgradeEnds!, { locale: ptBR, addSuffix: true })}`
              : 'Concluindo...'}
          </p>
        </div>
      ) : (
        <>
          {costNext && (
            <div className="grid grid-cols-2 gap-1 text-xs text-parchment-400">
              <span>🌾 {costNext.food}</span>
              <span>🪵 {costNext.wood}</span>
              <span>🪨 {costNext.stone}</span>
              <span>⚙️ {costNext.iron}</span>
              <span className="col-span-2 text-parchment-500">⏱ {Math.ceil(timeNext / 60)} min</span>
            </div>
          )}
          {msg && <p className="text-xs text-center text-parchment-300">{msg}</p>}
          <Button
            size="sm"
            variant={canUpgrade ? 'primary' : 'ghost'}
            disabled={!canUpgrade || building.level >= config.maxLevel}
            loading={loading}
            onClick={handleUpgrade}
          >
            {building.level >= config.maxLevel ? 'Máximo' : `Evoluir → Nv ${building.level + 1}`}
          </Button>
        </>
      )}
    </div>
  );
};
