#!/usr/bin/env tsx
import { Command } from 'commander';
import { config } from '../config/index.js';
import { handleMeetingNotes } from '../agent/planner.js';
import { client } from '../tools/index.js';
import { extractStructuredContent } from '../util/parser.js';

const program = new Command();

program.name('pm-agent')
	.description('Personal AI agent for managing tasks and memory')
	.option('-f, --file <path>', 'Path to meeting notes markdown file')
	.option('-p, --parse <path>', 'Path to meeting notes markdown file to parse');

program.parse(process.argv);
const options = program.opts();
console.log(options)

if (options.parse) {
	console.log("only parse")
	console.log(JSON.stringify(await extractStructuredContent(options.parse)));
}
else if (options.file) {
	await handleMeetingNotes(options.file);

} else {
	console.log('No file provided. Use --file <path>');
}

