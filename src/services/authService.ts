import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool';
import { memoryStore } from '../db/memoryStore';
import { config } from '../config';
import { User, CreatorProfile, AuthTokenPayload } from '../types';

export class AuthService {
  public static async testDb(): Promise<boolean> {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

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
    const isDb = await this.testDb();
    const passwordHash = await bcrypt.hash(data.password, 10);
    const userId = uuidv4();
    const now = new Date().toISOString();

    if (isDb) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [data.email.toLowerCase()]);
      if (existing.rows.length > 0) {
        throw new Error('Email is already registered');
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const userRes = await client.query(
          `INSERT INTO users (id, email, password_hash, role, full_name, avatar_url, company_name, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           RETURNING id, email, role, full_name, avatar_url, company_name, created_at, updated_at`,
          [
            userId,
            data.email.toLowerCase(),
            passwordHash,
            data.role,
            data.full_name,
            data.avatar_url || null,
            data.company_name || null,
          ]
        );
        const user = userRes.rows[0];

        if (data.role === 'creator') {
          const slug = data.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          await client.query(
            `INSERT INTO creator_profiles 
             (user_id, slug, headline, bio, location, hourly_rate, rating, verified, specializations, availability_status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, 5.0, false, $7, 'available', NOW(), NOW())`,
            [
              userId,
              slug,
              data.headline || 'AI Creator & Specialist',
              data.bio || '',
              data.location || 'Remote',
              data.hourly_rate || 75.0,
              data.specializations || [],
            ]
          );
        }

        await client.query('COMMIT');
        const token = this.generateToken({ userId: user.id, email: user.email, role: user.role });
        return { user, token };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      for (const u of memoryStore.users.values()) {
        if (u.email.toLowerCase() === data.email.toLowerCase()) {
          throw new Error('Email is already registered');
        }
      }

      const user: User = {
        id: userId,
        email: data.email.toLowerCase(),
        password_hash: passwordHash,
        role: data.role,
        full_name: data.full_name,
        avatar_url: data.avatar_url || null,
        company_name: data.company_name || null,
        created_at: now,
        updated_at: now,
      };
      memoryStore.users.set(userId, user);

      if (data.role === 'creator') {
        const slug = data.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const creatorProfile: CreatorProfile = {
          user_id: userId,
          slug,
          headline: data.headline || 'AI Creator & Specialist',
          bio: data.bio || '',
          location: data.location || 'Remote',
          hourly_rate: data.hourly_rate || 75.0,
          rating: 5.0,
          verified: false,
          specializations: data.specializations || [],
          languages: ['English'],
          availability_status: 'available',
          created_at: now,
          updated_at: now,
        };
        memoryStore.creatorProfiles.set(userId, creatorProfile);
      }

      const { password_hash, ...safeUser } = user;
      const token = this.generateToken({ userId: user.id, email: user.email, role: user.role });
      return { user: safeUser, token };
    }
  }

  public static async signin(data: {
    email: string;
    password: string;
  }): Promise<{ user: Partial<User>; token: string }> {
    const isDb = await this.testDb();

    if (isDb) {
      const res = await pool.query('SELECT * FROM users WHERE email = $1', [data.email.toLowerCase()]);
      if (res.rows.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = res.rows[0];
      const valid = await bcrypt.compare(data.password, user.password_hash);
      if (!valid) {
        throw new Error('Invalid email or password');
      }

      const { password_hash, ...safeUser } = user;
      const token = this.generateToken({ userId: user.id, email: user.email, role: user.role });
      return { user: safeUser, token };
    } else {
      let foundUser: User | undefined;
      for (const u of memoryStore.users.values()) {
        if (u.email.toLowerCase() === data.email.toLowerCase()) {
          foundUser = u;
          break;
        }
      }

      if (!foundUser) {
        throw new Error('Invalid email or password');
      }

      const valid = await bcrypt.compare(data.password, foundUser.password_hash);
      if (!valid) {
        throw new Error('Invalid email or password');
      }

      const { password_hash, ...safeUser } = foundUser;
      const token = this.generateToken({ userId: foundUser.id, email: foundUser.email, role: foundUser.role });
      return { user: safeUser, token };
    }
  }

  public static async getProfile(userId: string): Promise<any> {
    const isDb = await this.testDb();

    if (isDb) {
      const userRes = await pool.query(
        'SELECT id, email, role, full_name, avatar_url, company_name, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );
      if (userRes.rows.length === 0) {
        throw new Error('User not found');
      }
      const user = userRes.rows[0];

      if (user.role === 'creator') {
        const creatorRes = await pool.query('SELECT * FROM creator_profiles WHERE user_id = $1', [userId]);
        const creatorProfile = creatorRes.rows[0] || null;
        return { ...user, creator_profile: creatorProfile };
      }

      return user;
    } else {
      const user = memoryStore.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }
      const { password_hash, ...safeUser } = user;

      if (safeUser.role === 'creator') {
        const creatorProfile = memoryStore.creatorProfiles.get(userId);
        return { ...safeUser, creator_profile: creatorProfile || null };
      }

      return safeUser;
    }
  }

  private static generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
  }
}
