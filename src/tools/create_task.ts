import pool from '../db/index.js';

import { randomUUID } from 'crypto';
export async function create_task({
	description,
	owner,
	due_date,
}: {
	description: string;
	owner?: string;
	due_date?: string;
}) {
	const query = `
    INSERT INTO agent_memory.tasks (id, description, owner, due_date)
    VALUES ($4, $1, $2, $3)
    RETURNING id, description, owner, due_date, created_at;
  `;

	const values = [description, owner ?? null, due_date ?? null, randomUUID()];

	const result = await pool.query(query, values);

	return result.rows[0];
}
