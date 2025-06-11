import OpenAI from 'openai';
import type {
	ChatCompletionMessageParam,
	ChatCompletionTool
} from 'openai/resources/chat/completions';

import { create_task } from '../tools/index.js';
import { ParsedMeeting } from '../util/parser.js';
import { client as atlassianClient } from '../tools/index.js'; // THIS IS THE ATLASSIAN CLIENT

import crypto from 'crypto';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `
You are a helpful executive assistant. Your job is to parse meeting notes and determine what tasks need to be created or updated.
Some tasks may use contextual dates, like "this Thursday". The datetime now is: ${new Date().toString()}
Only create actionable tasks. Ignore information that is non-actionable.
`;

const tools: Record<string, (args: any) => Promise<any>> = {
	create_task
};
const functionDefinitions: ChatCompletionTool[] = [
	{
		type: 'function',
		function: {
			name: 'create_task',
			description: 'Create a new task and store it in the agent memory database.',
			parameters: {
				type: 'object',
				properties: {
					description: { type: 'string' },
					owner: { type: 'string', nullable: true },
					due_date: { type: 'string', format: 'date', nullable: true }
				},
				required: ['description']
			}
		}
	}
];

export async function runAgentLoop(meeting: ParsedMeeting) {
	const messages: ChatCompletionMessageParam[] = [
		{ role: 'system', content: SYSTEM_PROMPT },
		{ role: 'user', content: formatStructuredNotes(meeting) }
	];

	for (let step = 0; step < 5; step++) {
		const response = await openai.chat.completions.create({
			model: 'gpt-4.1-mini',
			messages,
			temperature: 0.3,
			tools: functionDefinitions,
			tool_choice: 'auto'
		});

		const choice = response.choices[0];
		const toolCall = choice.message.tool_calls?.[0];

		if (toolCall) {
			const { name, arguments: argsJSON } = toolCall.function;
			const args = JSON.parse(argsJSON);
			const result = await tools[name](args);

			messages.push({
				role: 'assistant',
				tool_calls: [toolCall]
			});

			messages.push({
				role: 'tool',
				name: toolCall.function.name,
				tool_call_id: toolCall.id,
				content: JSON.stringify(result)
			} as ChatCompletionMessageParam);
		} else {
			messages.push(choice.message); // maybe final summary or thoughts
			break;
		}
	}

	console.log('[Agent] Final assistant message:', messages.at(-1));
}
// Helper to flatten sections into readable format
function formatStructuredNotes(meeting: ParsedMeeting): string {
	const { title, sections } = meeting;
	let output = `Meeting Title: ${title}\n`;

	for (const section of sections) {
		output += `\n## ${section.heading}\n`;
		for (const bullet of section.bullets) {
			output += `- ${bullet}\n`;
		}
	}

	return output;
}

