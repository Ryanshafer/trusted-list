import type { CardData, SectionKey } from "@/features/dashboard/types";

export const filterAndSortCards = (cards: CardData[]): CardData[] => {
  return cards
    .filter((card) => {
      if (!card.endDate) return true;
      return new Date(card.endDate).getTime() > Date.now();
    })
    .sort((a, b) => {
      // Cards without deadlines go to the end
      if (!a.endDate && !b.endDate) return 0;
      if (!a.endDate) return 1;
      if (!b.endDate) return -1;

      // Sort by deadline (soonest first)
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    });
};

export const getInitialTierIndex = (score: number): number => {
  if (score >= 900) return 4;
  if (score >= 700) return 3;
  if (score >= 500) return 2;
  if (score >= 300) return 1;
  return 0;
};

export const getGreetingTargetIndex = (): number => {
  const hours = new Date().getHours();
  if (hours < 12) return 0;
  if (hours < 18) return 1;
  return 2;
};

export const getDaysLeftInMonth = (): number => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
};