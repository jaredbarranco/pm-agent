import fs from 'fs/promises';
import { parseDate } from 'chrono-node';
import MarkdownIt from 'markdown-it';

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

const md = new MarkdownIt();

export type ParsedMeeting = {
	title: string;
	sections: {
		heading: string;
		bullets: string[];
	}[];
};

export async function extractStructuredContent(filePath: string): Promise<ParsedMeeting> {
	const raw = await fs.readFile(filePath, 'utf-8');
	const tokens = md.parse(raw, {});
	const output: ParsedMeeting = { title: '', sections: [] };

	let currentSection: ParsedMeeting['sections'][0] | null = null;

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];

		if (token.type === 'heading_open' && token.tag === 'h1') {
			const content = tokens[i + 1]?.content;
			output.title = content;
		}

		if (token.type === 'heading_open' && /^h\d+$/.test(token.tag) && token.tag !== 'h1') {
			if (currentSection) output.sections.push(currentSection);
			const headingText = tokens[i + 1]?.content || '';
			currentSection = { heading: headingText, bullets: [] };
		}

		if (token.type === 'list_item_open') {
			const contentToken = tokens[i + 2]; // skip list_item_open + paragraph_open
			const bullet = contentToken?.content;
			if (bullet && currentSection) currentSection.bullets.push(bullet);
		}
	}

	if (currentSection) output.sections.push(currentSection);

	return output;
}
