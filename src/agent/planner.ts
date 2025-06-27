import { extractStructuredContent, extractTasksFromFile, ParsedMeeting } from '../util/parser.js';
import { createTask, getOpenTasks } from '../db/tasks.js';
import { randomUUID } from 'crypto';
import { runAgentLoop } from './task_id_agent.js';

const debug: boolean = false;

export async function handleMeetingNotes(filePath: string) {
	if (debug) { console.log(`[Agent] Handling meeting notes from: ${filePath}`) };

	// const structured = await extractTasksFromFile(filePath);
	const structured: ParsedMeeting | void = await extractStructuredContent(filePath).catch((error) => {
		console.error(`Error parsing md: ${JSON.stringify(error)}`)
	});
	if (debug) { console.log(`Parsed Meeting Notes: ${JSON.stringify(structured)}`) }

	if (structured) {
		await runAgentLoop(structured);
	}

	// if(debug){console.log('\n[Agent] Proposed Task Plan:\n')};
	// for (const t of plan) {
	// 	if(debug){console.log(`- [ ] ${t.description} (owner: ${t.owner})`)};
	// }
	//
	// // Auto-insert all (can add prompt logic later)
	// for (const task of plan) {
	// 	await createTask(task);
	// }
	//
	// if(debug){console.log(`\n[Agent] Added ${plan.length} tasks to memory.`)};
}
