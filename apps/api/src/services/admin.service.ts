import { db } from '../config/db.js';
import type { Role, SafeUser } from '@pulsepass/shared';
import { AppError } from '../utils/errors.js';

export class AdminService {
  /**
   * Lists all users with optional role filtering
   */
  static async listUsers(role?: Role, page = 1, limit = 50): Promise<{ users: SafeUser[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let pIdx = 1;

    if (role) {
      conditions.push(`role = $${pIdx++}`);
      params.push(role);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query<{ count: string }>(`SELECT COUNT(*) as count FROM users ${where};`, params);
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const offset = (page - 1) * limit;
    const usersSql = `
      SELECT id, email, name, phone, role, created_at, updated_at
      FROM users
      ${where}
      ORDER BY created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;
    const usersRes = await db.query<SafeUser>(usersSql, [...params, limit, offset]);

    return {
      users: usersRes.rows,
      total,
    };
  }

  /**
   * Updates user role guard level
   */
  static async updateUserRole(userId: string, newRole: Role): Promise<SafeUser> {
    const res = await db.query<SafeUser>(
      `UPDATE users
       SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, name, phone, role, created_at, updated_at;`,
      [newRole, userId],
    );

    if (res.rowCount === 0 || !res.rows[0]) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return res.rows[0];
  }
}
