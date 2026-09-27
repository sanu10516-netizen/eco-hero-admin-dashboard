import type { Timestamp } from "firebase/firestore";

export const COLLECTIONS = {
  players: "users",
  scores: "scores",
  sessions: "gameSessions",
  inventory: "inventory",
  research: "questionnaire_responses",
  admins: "admins",
  posts: "communityPosts",
  bans: "communityBans",
} as const;

export type CollectionKey = keyof typeof COLLECTIONS;

export interface PlayerDoc {
  username?: string;
  email?: string;
  totalScore?: number;
  currentLevel?: number;
  coins?: number;
  equippedSkin?: string;
  createdAt?: Timestamp | null;
}

export interface Player extends PlayerDoc {
  uid: string;
}

export interface ScoreDoc {
  userId?: string;
  username?: string;
  score?: number;
  level?: number;
  stars?: number;
  timestamp?: Timestamp | null;

  trashCollected?: number;
  treesPlanted?: number;
}

export interface ScoreRun extends ScoreDoc {
  id: string;
}

export interface SessionDoc {
  userId?: string;
  sessionId?: string;
  startTime?: Timestamp | null;
  endTime?: Timestamp | null;
  scoreEarned?: number;
  levelPlayed?: number;
}

export interface Session extends SessionDoc {
  id: string;
}

export interface InventoryDoc {
  userId?: string;
  ownedSkins?: string[];
  coins?: number;
  equippedSkin?: string;
}

export interface Inventory extends InventoryDoc {
  id: string;
}

export interface ResearchDoc {
  userId?: string;
  missionNumber?: number;
  answer1?: string;
  answer2?: string;
  answer3?: string;
  submittedAt?: Timestamp | null;
}

export interface ResearchResponse extends ResearchDoc {
  id: string;
}

export interface AdminDoc {
  role?: string;
  name?: string;
  createdAt?: Timestamp | null;
}

export interface AdminProfile extends AdminDoc {
  uid: string;
}

export interface PostDoc {
  userId?: string;
  username?: string;
  body?: string;
  createdAt?: Timestamp | null;
  hidden?: boolean;
  hiddenBy?: string | null;
  hiddenAt?: Timestamp | null;
}

export interface Post extends PostDoc {
  id: string;
}

export interface BanDoc {
  userId?: string;
  username?: string;
  reason?: string;
  bannedBy?: string;
  bannedAt?: Timestamp | null;
}

export interface Ban extends BanDoc {
  id: string;
}

export const RESEARCH_QUESTIONS: { key: "answer1" | "answer2" | "answer3"; prompt: string }[] = [
  { key: "answer1", prompt: "Has playing changed how you think about litter?" },
  { key: "answer2", prompt: "Would you sort waste correctly in real life?" },
  { key: "answer3", prompt: "Do you feel planting trees makes a measurable difference?" },
];
