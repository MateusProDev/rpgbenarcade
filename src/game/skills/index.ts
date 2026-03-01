// ========================
// Skills System
// ========================
import type { Skill, ClassType, AdvancedClassType } from "../../types";
import { getClassSkills } from "../entities/classes";

export function getPlayerSkills(
  classType: ClassType,
  advancedClass?: AdvancedClassType
): Skill[] {
  return getClassSkills(classType, advancedClass);
}

export function getSkillById(
  skillId: string,
  classType: ClassType,
  advancedClass?: AdvancedClassType
): Skill | undefined {
  const skills = getClassSkills(classType, advancedClass);
  return skills.find((s) => s.id === skillId);
}
