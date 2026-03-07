import {
  doc, getDoc, setDoc, updateDoc, collection,
  query, where, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { Castle, BuildingType, Resources } from '../../types';
import { BUILDINGS, CASTLE_REQUIREMENTS, canUpgradeBuilding } from '../buildings/buildingConfig';
import { deductResources } from '../economy/economyLogic';

/** Carrega o castelo do jogador com cache local */
export async function loadCastle(castleId: string): Promise<Castle | null> {
  const snap = await getDoc(doc(db, 'castles', castleId));
  return snap.exists() ? (snap.data() as Castle) : null;
}

/** Inicia upgrade de um edifício */
export async function startBuildingUpgrade(
  castle: Castle,
  buildingType: BuildingType,
): Promise<{ success: boolean; message: string }> {
  const building = castle.buildings[buildingType];
  const check    = canUpgradeBuilding(castle.resources, buildingType, building.level);

  if (!check.canUpgrade) return { success: false, message: check.reason! };
  if (building.upgrading)  return { success: false, message: 'Edifício já em construção' };

  const nextLevel = building.level + 1;
  const cost      = BUILDINGS[buildingType].costPerLevel(nextLevel);
  const newResources = deductResources(castle.resources, cost);
  if (!newResources) return { success: false, message: 'Recursos insuficientes' };

  const duration  = BUILDINGS[buildingType].timePerLevel(nextLevel) * 1000; // ms
  const upgradeEnds = Date.now() + duration;

  await updateDoc(doc(db, 'castles', castle.id), {
    resources: newResources,
    [`buildings.${buildingType}.upgrading`]:   true,
    [`buildings.${buildingType}.upgradeEnds`]: upgradeEnds,
  });

  return { success: true, message: `Upgrade iniciado! Completa em ${Math.ceil(duration / 60000)} min.` };
}

/** Completa upgrade se o tempo passou */
export async function completeBuildingUpgrade(
  castle: Castle,
  buildingType: BuildingType,
): Promise<boolean> {
  const building = castle.buildings[buildingType];
  if (!building.upgrading || !building.upgradeEnds) return false;
  if (Date.now() < building.upgradeEnds) return false;

  await updateDoc(doc(db, 'castles', castle.id), {
    [`buildings.${buildingType}.level`]:       building.level + 1,
    [`buildings.${buildingType}.upgrading`]:   false,
    [`buildings.${buildingType}.upgradeEnds`]: null,
  });
  return true;
}

/** Verifica se o castelo pode evoluir */
export function canUpgradeCastle(castle: Castle): { canUpgrade: boolean; reason?: string } {
  const nextLevel = castle.level + 1;
  const req = CASTLE_REQUIREMENTS[nextLevel];
  if (!req) return { canUpgrade: false, reason: 'Nível máximo do castelo' };

  // Verifica edifícios
  for (const [bType, minLevel] of Object.entries(req.buildings) as [BuildingType, number][]) {
    if (castle.buildings[bType].level < minLevel) {
      return { canUpgrade: false, reason: `${BUILDINGS[bType].name} precisa ser nível ${minLevel}` };
    }
  }

  // Verifica recursos
  const resKeys = Object.keys(req.resources) as (keyof Resources)[];
  for (const res of resKeys) {
    if (castle.resources[res] < req.resources[res]) {
      return { canUpgrade: false, reason: `Recursos insuficientes: ${res}` };
    }
  }

  return { canUpgrade: true };
}

/** Cria castelo inicial para novo jogador */
export async function createInitialCastle(
  playerId: string,
  worldId: string,
  mapX: number,
  mapY: number,
): Promise<string> {
  const castleId  = `${playerId}_${worldId}`;
  const now       = Date.now();

  const initial: Castle = {
    id:       castleId,
    playerId,
    worldId,
    level:    1,
    mapX,
    mapY,
    resources: { food: 1000, wood: 1000, stone: 500, iron: 200 },
    lastResourceTick: now,
    buildings: {
      sawmill:   { type: 'sawmill',   level: 1, upgrading: false, upgradeEnds: null },
      quarry:    { type: 'quarry',    level: 1, upgrading: false, upgradeEnds: null },
      ironMine:  { type: 'ironMine',  level: 1, upgrading: false, upgradeEnds: null },
      farm:      { type: 'farm',      level: 1, upgrading: false, upgradeEnds: null },
      barracks:  { type: 'barracks',  level: 1, upgrading: false, upgradeEnds: null },
      academy:   { type: 'academy',   level: 1, upgrading: false, upgradeEnds: null },
      warehouse: { type: 'warehouse', level: 1, upgrading: false, upgradeEnds: null },
    },
  };

  await setDoc(doc(db, 'castles', castleId), initial);
  return castleId;
}

/** Cria nova aliança */
export async function createAlliance(
  worldId: string,
  leaderId: string,
  name: string,
  tag: string,
): Promise<string> {
  const existing = await getDocs(
    query(collection(db, 'alliances'), where('worldId', '==', worldId), where('tag', '==', tag)),
  );
  if (!existing.empty) throw new Error('Tag já em uso neste mundo');

  const allianceRef = doc(collection(db, 'alliances'));
  await setDoc(allianceRef, {
    id:             allianceRef.id,
    worldId,
    name,
    tag:            tag.toUpperCase(),
    leaderId,
    members:        [leaderId],
    bases:          [],
    controlsCastle: false,
    createdAt:      serverTimestamp(),
  });

  await updateDoc(doc(db, 'players', leaderId), { allianceId: allianceRef.id });
  return allianceRef.id;
}
