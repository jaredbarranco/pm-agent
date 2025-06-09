import { extractTasksFromFile } from '../util/parser.js';
import { createTask, getOpenTasks } from '../db/tasks.js';
import { randomUUID } from 'crypto';

export async function handleMeetingNotes(filePath: string) {
	console.log(`[Agent] Handling meeting notes from: ${filePath}`);

	const extracted = await extractTasksFromFile(filePath);
	const openTasks = await getOpenTasks();

	const plan = extracted.map((task) => {
		return {
			...task,
			id: randomUUID(),
			context: filePath,
		};
	});

	console.log('\n[Agent] Proposed Task Plan:\n');
	for (const t of plan) {
		console.log(`- [ ] ${t.description} (owner: ${t.owner})`);
	}

	// Auto-insert all (can add prompt logic later)
	for (const task of plan) {
		await createTask(task);
	}

	console.log(`\n[Agent] Added ${plan.length} tasks to memory.`);
}
