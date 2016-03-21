#!/usr/bin/env node
'use strict';

const pkg = require('../package.json');
const program = require('commander');

// Command-line configuration
program
	.version(pkg.version)
	.command('cr', 'Open and close a change request')
	.parse(process.argv);
