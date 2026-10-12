import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/pool';
import { config } from '../config';
import { User, AuthTokenPayload } from '../types';

export class AuthService {
  public static async signup(data: {
    email: string;
    password: string;
    role: 'brand' | 'creator' | 'admin';
    full_name: string;
    avatar_url?: string;
    company_name?: string;
    headline?: string;
    bio?: string;
    location?: string;
    hourly_rate?: number;
    specializations?: string[];
  }): Promise<{ user: Partial<User>; token: string }> {
    const db = getDb();
    const passwordHash = await bcrypt.hash(data.password, 10);
    const userId = uuidv4();
    const now = new Date().toISOString();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email.toLowerCase());
    if (existing) {
      throw new Error('Email is already registered');
    }

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, role, full_name, avatar_url, company_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(userId, data.email.toLowerCase(), passwordHash, data.role, data.full_name,
      data.avatar_url || null, data.company_name || null, now, now);

    if (data.role === 'creator') {
      const slug = data.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const insertCreator = db.prepare(`
        INSERT INTO creator_profiles (user_id, slug, headline, bio, location, hourly_rate, rating, verified, specializations, availability_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 5.0, 0, ?, 'available', ?, ?)
      `);
      insertCreator.run(userId, slug, data.headline || 'AI Creator & Specialist',
        data.bio || '', data.location || 'Remote', data.hourly_rate || 75.0,
        JSON.stringify(data.specializations || []), now, now);
    }

    const user = db.prepare('SELECT id, email, role, full_name, avatar_url, company_name, created_at, updated_at FROM users WHERE id = ?').get(userId) as any;
    const token = this.generateToken({ userId: user.id, email: user.email, role: user.role });
    return { user, token };
  }

  public static async signin(data: { email: string; password: string }): Promise<{ user: Partial<User>; token: string }> {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(data.email.toLowerCase()) as any;

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const { password_hash, ...safeUser } = user;
    const token = this.generateToken({ userId: user.id, email: user.email, role: user.role });
    return { user: safeUser, token };
  }

  public static async getProfile(userId: string): Promise<any> {
    const db = getDb();
    const user = db.prepare('SELECT id, email, role, full_name, avatar_url, company_name, created_at, updated_at FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'creator') {
      const profile = db.prepare('SELECT * FROM creator_profiles WHERE user_id = ?').get(userId) as any;
      if (profile) {
        profile.specializations = JSON.parse(profile.specializations || '[]');
        profile.languages = JSON.parse(profile.languages || '[]');
        profile.verified = !!profile.verified;
      }
      return { ...user, creator_profile: profile || null };
    }

    return user;
  }

  private static generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
  }
}
