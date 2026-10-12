import { User, CreatorProfile, Portfolio, CreatorReview, CreatorPackage, Brief, Match, SavedPick, InterviewInvite } from '../types';

export class MemoryStore {
  public users: Map<string, User> = new Map();
  public creatorProfiles: Map<string, CreatorProfile> = new Map();
  public portfolios: Map<string, Portfolio> = new Map();
  public reviews: Map<string, CreatorReview> = new Map();
  public packages: Map<string, CreatorPackage> = new Map();
  public briefs: Map<string, Brief> = new Map();
  public matches: Map<string, Match> = new Map();
  public savedPicks: Map<string, SavedPick> = new Map();
  public interviewInvites: Map<string, InterviewInvite> = new Map();

  private static instance: MemoryStore;

  private constructor() {}

  public static getInstance(): MemoryStore {
    if (!MemoryStore.instance) {
      MemoryStore.instance = new MemoryStore();
    }
    return MemoryStore.instance;
  }
}

export const memoryStore = MemoryStore.getInstance();
