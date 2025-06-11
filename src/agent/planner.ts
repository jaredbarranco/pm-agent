import { extractStructuredContent, extractTasksFromFile, ParsedMeeting } from '../util/parser.js';
import { createTask, getOpenTasks } from '../db/tasks.js';
import { randomUUID } from 'crypto';
import { runAgentLoop } from './task_id_agent.js';

export async function handleMeetingNotes(filePath: string) {
	console.log(`[Agent] Handling meeting notes from: ${filePath}`);

	// const structured = await extractTasksFromFile(filePath);
	const structured: ParsedMeeting | void = await extractStructuredContent(filePath).catch((error) => {
		console.error(`Error parsing md: ${JSON.stringify(error)}`)
	});
	console.log(`Parsed Meeting Notes: ${JSON.stringify(structured)}`)

	if (structured) {
		await runAgentLoop(structured);
	}

	// console.log('\n[Agent] Proposed Task Plan:\n');
	// for (const t of plan) {
	// 	console.log(`- [ ] ${t.description} (owner: ${t.owner})`);
	// }
	//
	// // Auto-insert all (can add prompt logic later)
	// for (const task of plan) {
	// 	await createTask(task);
	// }
	//
	// console.log(`\n[Agent] Added ${plan.length} tasks to memory.`);
}
