import type { Timestamp } from "firebase/firestore";

/**
 * The contract between this console and the Unity client.
 *
 * Firestore collection names are case sensitive. Every name below is spelled
 * exactly as the game writes it, and nothing reads a collection the game does
 * not produce. If a view is empty, the collection really is empty; it is not a
 * spelling mistake on this side.
 */
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

/** users/{uid} */
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

/** scores/{autoId} */
export interface ScoreDoc {
  userId?: string;
  username?: string;
  score?: number;
  level?: number;
  stars?: number;
  timestamp?: Timestamp | null;

  /**
   * Ecological output for the run.
   *
   * The Unity client does not write these yet. Score alone cannot be split back
   * into its parts, because 300 points is both three bags of litter and two
   * saplings, so guessing would put an invented number on a research report.
   * The views below read these when present and say plainly that the client is
   * not recording them when absent.
   */
  trashCollected?: number;
  treesPlanted?: number;
}

export interface ScoreRun extends ScoreDoc {
  id: string;
}

/** gameSessions/{autoId} */
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

/** inventory/{uid} */
export interface InventoryDoc {
  userId?: string;
  ownedSkins?: string[];
  coins?: number;
  equippedSkin?: string;
}

export interface Inventory extends InventoryDoc {
  id: string;
}

/** questionnaire_responses/{autoId} */
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

/** admins/{uid} */
export interface AdminDoc {
  role?: string;
  name?: string;
  createdAt?: Timestamp | null;
}

export interface AdminProfile extends AdminDoc {
  uid: string;
}

/** communityPosts/{autoId} */
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

/** communityBans/{uid} */
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

/**
 * The wording used by the questionnaire in the game. Kept here so the research
 * view can label its charts without the answer letters meaning nothing to a
 * reader. Update these if the in game copy changes.
 */
export const RESEARCH_QUESTIONS: { key: "answer1" | "answer2" | "answer3"; prompt: string }[] = [
  { key: "answer1", prompt: "Has playing changed how you think about litter?" },
  { key: "answer2", prompt: "Would you sort waste correctly in real life?" },
  { key: "answer3", prompt: "Do you feel planting trees makes a measurable difference?" },
];
