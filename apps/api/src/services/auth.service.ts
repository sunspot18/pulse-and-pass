import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { ENV } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import type { SafeUser, User } from '@pulsepass/shared';
import type { LoginInput, RegisterInput } from '@pulsepass/shared';

const JWT_EXPIRES_IN = '7d';

export class AuthService {
  static async register(input: RegisterInput): Promise<{ user: SafeUser; token: string }> {
    // 1. Check if user already exists
    const existing = await db.query<User>('SELECT id FROM users WHERE email = $1;', [input.email]);
    if (existing.rowCount > 0) {
      throw new AppError('An account with this email address already exists', 409, 'EMAIL_EXISTS');
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // 3. Insert new user
    const res = await db.query<User>(
      `INSERT INTO users (email, password_hash, name, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, password_hash, name, phone, role, created_at, updated_at;`,
      [input.email, passwordHash, input.name, input.phone, input.role || 'attendee'],
    );

    const fullUser = res.rows[0]!;
    const { password_hash: _, ...safeUser } = fullUser;
    const token = this.generateToken(safeUser);

    return { user: safeUser, token };
  }

  static async login(input: LoginInput): Promise<{ user: SafeUser; token: string }> {
    // 1. Fetch user by email
    const res = await db.query<User>(
      'SELECT id, email, password_hash, name, phone, role, created_at, updated_at FROM users WHERE email = $1;',
      [input.email],
    );

    if (res.rowCount === 0) {
      throw new AppError('Invalid email or password combination', 401, 'INVALID_CREDENTIALS');
    }

    const fullUser = res.rows[0]!;

    // 2. Verify password
    const valid = await bcrypt.compare(input.password, fullUser.password_hash);
    if (!valid) {
      throw new AppError('Invalid email or password combination', 401, 'INVALID_CREDENTIALS');
    }

    const { password_hash: _, ...safeUser } = fullUser;
    const token = this.generateToken(safeUser);

    return { user: safeUser, token };
  }

  static async getUserById(id: string): Promise<SafeUser | null> {
    const res = await db.query<SafeUser>(
      'SELECT id, email, name, phone, role, created_at, updated_at FROM users WHERE id = $1;',
      [id],
    );
    return res.rows[0] || null;
  }

  static generateToken(user: SafeUser): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      ENV.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );
  }

  static verifyToken(token: string): { userId: string; email: string; role: string; name: string } {
    return jwt.verify(token, ENV.JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
      name: string;
    };
  }
}
