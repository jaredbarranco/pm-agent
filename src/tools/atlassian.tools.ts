import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ChatCompletionTool } from "openai/resources/index";

const transport = new StdioClientTransport({
	command: "npx",
	args: ["-y", "mcp-remote", "https://mcp.atlassian.com/v1/sse"]
});

export const client = new Client({
	name: "pm-agent-client",
	version: "0.1.0"
});

await client.connect(transport);

export async function loadAtlassianTools(): Promise<{
	atlassianFunctions: ChatCompletionTool[];
	atlassianToolMap: Record<string, (args: any) => Promise<any>>;
}> {
	const tools = await client.listTools().then((data) => { return data.tools });
	const toolMap: Record<string, (args: any) => Promise<any>> = {};
	const functions: ChatCompletionTool[] = [];

	for (const tool of tools) {
		const { name, description, inputSchema } = tool;

		// Create a function definition compatible with OpenAI
		functions.push({
			type: 'function',
			function: {
				name,
				description: description ?? 'No description provided.',
				parameters: inputSchema ?? {
					type: 'object',
					properties: {},
					required: []
				}
			}
		});

		// Add handler to tool map
		toolMap[name] = async (args: any) => {
			return await client.callTool({
				name,
				arguments: args
			});
		};
	}

	return { atlassianFunctions: functions, atlassianToolMap: toolMap };
}
