#!/usr/bin/env tsx

import { Command } from 'commander';
import { config } from '../config/index.js';
import { handleMeetingNotes } from '../agent/planner.js';

const program = new Command();

program
	.name('pm-agent')
	.description('Personal AI agent for managing tasks and memory')
	.option('-f, --file <path>', 'Path to meeting notes markdown file');

program.parse(process.argv);
const options = program.opts();
console.log(options)

if (options.file) {
	await handleMeetingNotes(options.file);
} else {
	console.log('No file provided. Use --file <path>');
}

