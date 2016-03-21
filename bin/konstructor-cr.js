#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const KonstructorApiClient = require('..');
const program = require('commander');

// Command-line configuration
program
	.usage('[options]')
	.option(
		'-g, --gateway <gateway>',
		'a gateway to log the change request to, one of "internal", "konstructor", "mashery", "test". Default: "konstructor"',
		'konstructor'
	)
	.option(
		'-a, --api-key <key>',
		'an API key for use with "konstructor" or "mashery" gateways',
		process.env.KONSTRUCTOR_API_KEY
	)
	.option(
		'-t, --type <type>',
		'a change request type, one of "emergency", "fyi", "normal", "releaselog"'
	)
	.option(
		'-o, --owner-email <email>',
		'the change request owner email address'
	)
	.option(
		'-s, --summary <summary>',
		'a short summary of the change'
	)
	.option(
		'-d, --description <description>',
		'a short description of the change'
	)
	.option(
		'-r, --reason <reason>',
		'the reason for the change. Default: "Deployment"'
	)
	.option(
		'-c, --open-category <category>',
		'the category for opening the change request. One of "Major", "Minor", "Significant". Default: "Minor"'
	)
	.option(
		'-C, --close-category <category>',
		'the category for closing the change request. One of "Implemented", "Partially Implemented", "Rejected", "Rolled back", "Cancelled". Default: "Implemented"'
	)
	.option(
		'-R, --risk-profile <risk-profile>',
		'the risk profile for the change request. One of "Low", "Medium", "High". Default: "Low"'
	)
	.option(
		'-e, --environment <environment>',
		'the environment the change request applies to. One of "Production", "Test", "Development", "Disaster Recovery". Default: "Test"'
	)
	.option(
		'-O, --outage',
		'whether there will be an outage. Default: false'
	)
	.option(
		'-S, --service <service>',
		'the service that the change request applies to'
	)
	.option(
		'-n, --notify-channel <slack-channel>',
		'the slack channel to notify of the change request'
	)
	.parse(process.argv);

const apiClient = new KonstructorApiClient(program.gateway, program.apiKey);

// Gather up the data
const openData = {
	ownerEmailAddress: program.ownerEmail,
	summaryOfChange: program.summary,
	changeDescription: program.description,
	reasonForChangeDetails: program.reason,
	changeCategory: program.openCategory,
	riskProfile: program.riskProfile,
	environment: program.environment,
	willThereBeAnOutage: program.outage,
	resourceOne: program.ownerEmail,
	serviceIds: program.service,
	notifyChannel: program.notifyChannel
};
const closeData = {
	closedByEmailAddress: program.ownerEmail,
	closeCategory: program.closeCategory,
	notifyChannel: program.notifyChannel
};

// Create a change request
console.log(chalk.cyan.underline('Creating a change request'));
apiClient.createAndCloseChangeRequest(program.type, openData, closeData)
	.then(changeRequest => {
		console.log(chalk.green('Created and closed change request %s'), changeRequest.id);
	})
	.catch(error => {
		if (error.responseBody) {
			console.error(chalk.red(error.message));
			console.log(chalk.red(error.responseBody.message));
		} else {
			console.error(chalk.red(error.stack || error.message));
		}
		process.exit(1);
	});
