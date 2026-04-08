import type { CircleMember } from "../types";

export type SortOrder = "recent" | "asc" | "desc";

export function sortMembers(
  members: CircleMember[],
  order: SortOrder,
): CircleMember[] {
  if (order === "asc") {
    return [...members].sort((a, b) => a.name.localeCompare(b.name));
  }
  if (order === "desc") {
    return [...members].sort((a, b) => b.name.localeCompare(a.name));
  }
  return [...members].sort(
    (a, b) => (b.awaiting ? 1 : 0) - (a.awaiting ? 1 : 0),
  );
}

export function filterMembers(
  members: CircleMember[],
  query: string,
): CircleMember[] {
  if (!query.trim()) {
    return members;
  }

  const normalizedQuery = query.toLowerCase();
  return members.filter(
    (member) =>
      member.name.toLowerCase().includes(normalizedQuery) ||
      member.verifiedSkills?.some((skill) =>
        skill.toLowerCase().includes(normalizedQuery),
      ),
  );
}
