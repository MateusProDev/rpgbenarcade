// ========================
// Title System
// ========================

export type TitleConfig = {
  id: string;
  name: string;
  description: string;
  requirement: (stats: { level: number; pvpWins: number; kills: number }) => boolean;
};

export const TITLES: TitleConfig[] = [
  {
    id: "novice",
    name: "Novato",
    description: "Começou sua jornada.",
    requirement: () => true,
  },
  {
    id: "warrior",
    name: "Guerreiro",
    description: "Alcançou nível 5.",
    requirement: (s) => s.level >= 5,
  },
  {
    id: "veteran",
    name: "Veterano",
    description: "Alcançou nível 10.",
    requirement: (s) => s.level >= 10,
  },
  {
    id: "champion",
    name: "Campeão",
    description: "Alcançou nível 15.",
    requirement: (s) => s.level >= 15,
  },
  {
    id: "legend",
    name: "Lenda",
    description: "Alcançou nível 20.",
    requirement: (s) => s.level >= 20,
  },
  {
    id: "dark_knight_title",
    name: "Cavaleiro Sombrio",
    description: "Venceu 10 batalhas PvP.",
    requirement: (s) => s.pvpWins >= 10,
  },
  {
    id: "dragon_slayer",
    name: "Matador de Dragões",
    description: "Derrotou o Dragão Ancestral.",
    requirement: (s) => s.kills >= 100,
  },
  {
    id: "arena_king",
    name: "Rei da Arena",
    description: "Venceu 25 batalhas PvP.",
    requirement: (s) => s.pvpWins >= 25,
  },
];

export function getAvailableTitles(stats: { level: number; pvpWins: number; kills: number }): TitleConfig[] {
  return TITLES.filter((t) => t.requirement(stats));
}
