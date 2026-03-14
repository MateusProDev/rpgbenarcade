/**
 * BattleReportView — displays a battle result report.
 */

import type { BattleReport } from '../../types/battle';
import { TROOP_DEFINITIONS } from '../../game/config/troops.config';

interface BattleReportViewProps {
  report: BattleReport;
}

export function BattleReportView({ report }: BattleReportViewProps) {
  const { result } = report;
  const isVictory =
    (report.isAttacker && result.winner === 'attacker') ||
    (!report.isAttacker && result.winner === 'defender');

  return (
    <div className={`p-4 rounded-lg border ${isVictory ? 'border-green-600 bg-green-900/20' : 'border-red-600 bg-red-900/20'}`}>
      <h3 className="font-medieval text-lg mb-2">
        {isVictory ? '⚔️ Vitória!' : '💀 Derrota!'}
      </h3>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-parchment-300 font-bold mb-1">Perdas do Atacante:</p>
          {result.attackerLosses.map((tc) => (
            <p key={tc.type} className="text-parchment-200">
              {TROOP_DEFINITIONS[tc.type]?.name ?? tc.type}: -{tc.count}
            </p>
          ))}
        </div>

        <div>
          <p className="text-parchment-300 font-bold mb-1">Perdas do Defensor:</p>
          {result.defenderLosses.map((tc) => (
            <p key={tc.type} className="text-parchment-200">
              {TROOP_DEFINITIONS[tc.type]?.name ?? tc.type}: -{tc.count}
            </p>
          ))}
        </div>
      </div>

      {result.winner === 'attacker' && (
        <div className="mt-3 text-sm">
          <p className="text-castle-gold font-bold">Recursos Capturados:</p>
          <div className="flex gap-3 text-parchment-200">
            {result.resourcesStolen.wood > 0 && <span>🪵 {result.resourcesStolen.wood}</span>}
            {result.resourcesStolen.stone > 0 && <span>🪨 {result.resourcesStolen.stone}</span>}
            {result.resourcesStolen.iron > 0 && <span>⚙️ {result.resourcesStolen.iron}</span>}
            {result.resourcesStolen.food > 0 && <span>🌾 {result.resourcesStolen.food}</span>}
            {result.resourcesStolen.gold > 0 && <span>🪙 {result.resourcesStolen.gold}</span>}
          </div>
        </div>
      )}

      <p className="text-xs text-parchment-400 mt-2">
        {new Date(report.timestamp).toLocaleString('pt-BR')}
      </p>
    </div>
  );
}
