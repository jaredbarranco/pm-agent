import fs from 'fs/promises';
import { parseDate } from 'chrono-node';

export type ExtractedTask = {
	description: string;
	owner?: string;
	due_date?: string;
};

export async function extractTasksFromFile(filePath: string): Promise<ExtractedTask[]> {
	const raw = await fs.readFile(filePath, 'utf-8');
	const lines = raw.split('\n').filter(line => line.trim());

	return lines.map(line => {
		const description = line.trim();
		const owner = line.split(' ')[0];

		const parsedDate = parseDate(description);
		const due_date = parsedDate ? parsedDate.toISOString().split('T')[0] : undefined;

		return {
			description,
			owner,
			due_date,
		};
	});
}
