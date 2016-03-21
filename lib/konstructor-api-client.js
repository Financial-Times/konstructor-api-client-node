'use strict';

const querystring = require('querystring');
const request = require('request');

const gatewayHostnames = {
	internal: 'http://konstructor.svc.ft.com',
	konstructor: 'https://konstructor.ft.com',
	mashery: 'https://api.ft.com/konstructor',
	test: 'http://test.konstructor.svc.ft.com'
};

const changeRequestTypes = [
	'emergency',
	'fyi',
	'normal',
	'releaselog'
];

module.exports = class KonstructorApiClient {

	constructor(gateway, apiKey) {
		if (!gateway) {
			throw new Error('Gateway is required');
		}
		if (!(gateway in gatewayHostnames)) {
			throw new Error('Gateway must be one of "mashery", "konstructor", or "internal"');
		}
		if (gateway !== 'internal' && gateway !== 'test' && !apiKey) {
			throw new Error(`Konstructor API key is required for the "${gateway}" gateway`);
		}
		this.apiKey = apiKey;
		this.gateway = gateway;
		this.hostname = gatewayHostnames[gateway];
	}

	createChangeRequest(type, data) {
		return this.sanitizeChangeRequestCreation(type, data)
			.then(data => {
				return this.request(`/v1/changerequest/${type}`, {
					body: querystring.stringify(data),
					method: 'POST'
				});
			})
			.then(json => {
				return json.changeRequests[0];
			});
	}

	closeChangeRequest(id, data) {
		return this.sanitizeChangeRequestClosure(data)
			.then(data => {
				return this.request(`/v1/changerequest/close/${id}`, {
					body: querystring.stringify(data),
					method: 'POST'
				});
			})
			.then(json => {
				return json.changeRequests[0];
			});
	}

	createAndCloseChangeRequest(type, openData, closeData) {
		return this.createChangeRequest(type, openData).then(changeLog => {
			return this.closeChangeRequest(changeLog.id, closeData);
		});
	}

	sanitizeChangeRequestCreation(type, data) {
		const sanitizedData = {
			notifyChannel: sanitizeSlackChannel(data.notifyChannel),
			willThereBeAnOutage: booleanToWord(data.willThereBeAnOutage, 'Yes', 'No'),
			notify: Boolean(data.notifyChannel)
		};
		const defaultData = {
			reasonForChangeDetails: 'Deployment',
			changeCategory: 'Minor',
			riskProfile: 'Low',
			environment: 'Test',
			willThereBeAnOutage: 'No'
		};
		if (changeRequestTypes.indexOf(type) === -1) {
			const allowedTypes = changeRequestTypes.map(type => `"${type}"`).join(', ');
			return Promise.reject(new Error(`Change request type must be one of ${allowedTypes}`));
		}
		return Promise.resolve(Object.assign(defaultData, data, sanitizedData));
	}

	sanitizeChangeRequestClosure(data) {
		const sanitizedData = {
			notifyChannel: sanitizeSlackChannel(data.notifyChannel),
			notify: Boolean(data.notifyChannel)
		};
		const defaultData = {
			closeCategory: 'Implemented'
		};
		return Promise.resolve(Object.assign(defaultData, data, sanitizedData));
	}

	request(endpoint, options) {
		const headers = options.headers || {};
		if (this.gateway === 'konstructor') {
			headers.Authorization = this.apiKey;
		} else if (this.gateway === 'mashery') {
			headers['X-Api-Key'] = this.apiKey;
		}
		if (options.method === 'POST') {
			headers['Content-Type'] = 'application/x-www-form-urlencoded';
		}
		options = Object.assign({
			url: this.hostname + endpoint,
			json: true,
			headers: headers
		}, options);
		return new Promise((resolve, reject) => {
			request(options, (error, response, body) => {
				if (error) {
					return reject(error);
				}
				if (response.statusCode >= 400) {
					const error = new Error(`API responded with a ${response.statusCode} status`);
					error.response = response;
					error.responseBody = body;
					return reject(error);
				}
				resolve(body);
			});
		});
	}

};

function sanitizeSlackChannel(channel) {
	if (channel && channel.indexOf('#') !== 0) {
		channel = '#' + channel;
	}
	return channel;
}

function booleanToWord(boolean, trueWord, falseWord) {
	return (boolean && boolean !== falseWord ? trueWord : falseWord);
}
