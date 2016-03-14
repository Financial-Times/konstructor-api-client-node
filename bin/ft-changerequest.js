#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const changeRequest = require('../lib/ft-changerequest');
const pkg = require('../package.json');
const program = require('commander');

// Command-line configuration
program
	.version(pkg.version)
	.usage('[options]')
	.parse(process.argv);

// Create a change request
console.log(chalk.cyan.underline('Creating a change request'));
changeRequest()
	.then(() => {
		console.log(chalk.green('Change request submitted'));
	})
	.catch(error => {
		console.error(chalk.red(error.stack || error.message));
		process.exit(1);
	});
