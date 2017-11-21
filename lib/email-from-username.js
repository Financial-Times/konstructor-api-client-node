'use strict';

const request = require('request');

const berthaEndpoint = 'https://bertha.ig.ft.com/republish/publish/gss/1mbJQYJOgXAH2KfgKUM1Vgxq8FUIrahumb39wzsgStu0/devs';

module.exports = emailFromUsername;

function emailFromUsername(username) {
	return new Promise((resolve, reject) => {
		const options = {
			url: berthaEndpoint,
			json: true
		};
		request(options, (error, response, developers) => {
			if (error) {
				return reject(error);
			}
			const developer = developers.find((developer) => {
				return (
					developer.githubname &&
					developer.githubname.toLowerCase() === username.toLowerCase()
				);
			});
			if (developer) {
				resolve(developer.email);
			} else {
				reject(new Error(`An email address could not be found for ${username}`));
			}
		});
	});
}
