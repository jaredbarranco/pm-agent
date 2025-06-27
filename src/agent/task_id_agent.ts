import OpenAI from 'openai';
import type {
	ChatCompletionMessageParam,
	ChatCompletionTool
} from 'openai/resources/chat/completions';

import { create_task } from '../tools/index.js';
import { ParsedMeeting } from '../util/parser.js';
import { loadAtlassianTools } from '../tools/index.js'; // The Atlassian MCP Client
import { randomUUID } from 'crypto';
import { create_actionLog } from '../db/action_log.js';

const debug: boolean = true;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `
#GOALS
You are a helpful executive assistant. Your job is to parse meeting notes and determine what tasks need to be created or updated.
Some tasks may use contextual dates, like "this Thursday". The datetime now is: ${new Date().toString()}
Only create actionable tasks. Ignore information that is non-actionable.

Before taking action, you should propose a project plan to the client. Your plan should include:
1. Confirmation of which tasks you're going to create
2. Which tools you are planning on running to complete the tasks
3. End your plan with a question like: "Do you have any feedback or are you ready for me to proceed?"
Be sure to update your project plan based on the client's feedback

##JIRA PROJECTS AND ISSUES
###Jira Projects
If the client asks you to create an issue of a non-standard type (standard issue types are: task, story, epic), request 'getJiraProjectIssueTypesMetadata' for the Project Key in context to see if there are any custom issue types.

###Jira Issues
If creating tasks or Jira issues, prefer to take direct action using available tools. If critical information is missing (e.g., project key), make a reasonable guess or use a default. Do not ask the client for clarification unless absolutely necessary. Project keys are typically included in issue keys. For example, EDI-432 is an issue key, and the associated project key is: 'EDI'.

### Jira Terminology
- Jira uses 'labels' in place of tags
`;

const localTools: Record<string, (args: any) => Promise<any>> = {
};

const localFunctionDefinitions: ChatCompletionTool[] = [
];


export async function runAgentLoop(meeting: ParsedMeeting, stepLimit: number = 20) {
	const invokeId: string = randomUUID().toString();
	console.log('invokeId: ', invokeId);

	const { atlassianFunctions, atlassianToolMap } = await loadAtlassianTools();

	const tools = {
		...localTools,
		...atlassianToolMap
	};

	const functionDefinitions = [
		...localFunctionDefinitions,
		...atlassianFunctions
	];
	const formattedNotes: string = formatStructuredNotes(meeting);

	const sessionId = await create_actionLog({ invokeId }).then((data) => { return data.id });
	const messages: ChatCompletionMessageParam[] = [
		{ role: 'system', content: SYSTEM_PROMPT },
		{ role: 'user', content: formattedNotes }
	];

	for (let step = 0; step < (stepLimit + 1); step++) {
		if (debug) { console.log('step: ', step) }
		const response = await openai.chat.completions.create({
			model: 'gpt-4.1-mini',
			messages,
			temperature: 0.3,
			tools: functionDefinitions,
			tool_choice: 'auto'
		});

		const choice = response.choices[0];
		const toolCalls = choice.message.tool_calls;

		if (toolCalls && toolCalls.length > 0) {
			if (debug) { console.log(`Calling ${toolCalls.length} tools: ${toolCalls}`) }
			for (const toolCall of toolCalls) {
				const { name, arguments: argsJSON } = toolCall.function;
				const args = JSON.parse(argsJSON);
				messages.push({
					role: 'assistant',
					tool_calls: [toolCall]
				});
				let result;
				try { // need catch in case LLM doesn't respect MCP tool params.
					result = await tools[name](args);
				} catch (error) {
					result = 'TOOL CALL ERROR: ' + JSON.stringify(error);
				}
				messages.push({
					role: 'tool',
					name: name,
					tool_call_id: toolCall.id,
					content: JSON.stringify(result)
				} as ChatCompletionMessageParam);
				if (debug) { console.log(`${tools[name]}result: `, result) };
				create_actionLog({ id: sessionId, invokeId, description: `FUNC: ${name} | RESULT: ${JSON.stringify(result)}` });


			}
		} else {
			if (debug) { console.log(`No tool calls requested by agent`) }
			// Assistant responded without a tool call, possibly asking the user
			const assistantMessage = choice.message.content ?? "";

			messages.push(choice.message); // Log the assistant's question or message

			const userInput = await getUserInput(assistantMessage);
			//exit if user wants to.
			if (userInput == 'exit') { process.exit(0) };
			messages.push({ role: 'user', content: userInput });
			continue; // Restart loop with updated input
		}
	}
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
async function getUserInput(prompt: string): Promise<string> {
	process.stdout.write(`${prompt}\n> `);
	return new Promise((resolve) => {
		const stdin = process.stdin;
		stdin.resume();
		stdin.once('data', (data) => {
			stdin.pause();
			resolve(data.toString().trim());
		});
	});
}
