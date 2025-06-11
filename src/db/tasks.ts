import pool from './index.js';

export type Task = {
	id: string;
	description: string;
	owner?: string;
	context?: string;
	status?: 'open' | 'complete' | 'expired';
	due_date?: string; // ISO date
};
export async function create_task({
	description,
	owner,
	due_date
}: {
	description: string;
	owner?: string;
	due_date?: string;
}): Promise<Task> {
	//@ts-ignore
	const result: Task = await pool.query(`
    INSERT INTO agent_memory.tasks (description, owner, due_date)
    VALUES (${description}, ${owner || null}, ${due_date || null})
    RETURNING id, description, owner, due_date, created_at;
  `);
	return result;
}
export async function createTask(task: Task): Promise<void> {
	const { id, description, owner, context, status, due_date } = task;
	await pool.query(`
    INSERT INTO agent_memory.tasks (id, description, owner, context, status, due_date)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [id, description, owner, context, status || 'open', due_date]);
}

export async function getOpenTasks(): Promise<Task[]> {
	const res = await pool.query(`
    SELECT * FROM agent_memory.tasks WHERE status = 'open'
  `);
	return res.rows;
}

export async function updateTaskStatus(id: string, newStatus: 'open' | 'complete' | 'expired'): Promise<void> {
	await pool.query(`
    UPDATE agent_memory.tasks SET status = $1, completed_at = NOW()
    WHERE id = $2
  `, [newStatus, id]);
}

