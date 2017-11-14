'use strict';

const assert = require('proclaim');
const mockery = require('mockery');

describe('lib/email-from-username', () => {
	let emailFromUsername;
	let request;

	beforeEach(() => {
		request = require('../mock/request');
		mockery.registerMock('request', request);

		emailFromUsername = require('../../../lib/email-from-username');
	});

	it('should export a function', () => {
		assert.isFunction(emailFromUsername);
	});

	describe('emailFromUsername(username)', () => {
		let mockResponse;
		let returnedPromise;

		beforeEach(() => {
			mockResponse = {
				body: [
					{
						githubname: 'foo',
						email: 'foo@ft.com'
					},
					{
						githubname: 'bar',
						email: 'bar@ft.com'
					}
				]
			};
			request.yieldsAsync(null, mockResponse, mockResponse.body);
			returnedPromise = emailFromUsername('foo');
		});

		it('should return a promise', () => {
			assert.instanceOf(returnedPromise, Promise);
		});

		describe('.then()', () => {
			let resolvedValue;

			beforeEach(done => {
				returnedPromise.then(value => {
					resolvedValue = value;
					done();
				}).catch(done);
			});

			it('should make a request to the bertha endpoint for developers', () => {
				assert.calledOnce(request);
				assert.isObject(request.firstCall.args[0]);
				assert.strictEqual(request.firstCall.args[0].url, 'http://bertha.ig.ft.com/republish/publish/gss/1mbJQYJOgXAH2KfgKUM1Vgxq8FUIrahumb39wzsgStu0/devs');
			});

			it('should request JSON', () => {
				assert.isTrue(request.firstCall.args[0].json);
			});

			it('should resolve with email address matching `username`', () => {
				assert.strictEqual(resolvedValue, 'foo@ft.com');
			});

		});

		describe('when the username does not have a corresponding email address', () => {

			beforeEach(() => {
				returnedPromise = emailFromUsername('baz');
			});

			describe('.catch()', () => {
				let caughtError;

				beforeEach(done => {
					returnedPromise.then(done).catch(error => {
						caughtError = error;
						done();
					});
				});

				it('should fail with the request error', () => {
					assert.instanceOf(caughtError, Error);
					assert.strictEqual(caughtError.message, 'An email address could not be found for baz');
				});

			});

		});

		describe('when the request errors', () => {
			let requestError;

			beforeEach(() => {
				requestError = new Error('request error');
				request.yieldsAsync(requestError);
				returnedPromise = emailFromUsername('foo');
			});

			describe('.catch()', () => {
				let caughtError;

				beforeEach(done => {
					returnedPromise.then(done).catch(error => {
						caughtError = error;
						done();
					});
				});

				it('should fail with the request error', () => {
					assert.strictEqual(caughtError, requestError);
				});

			});

		});

	});

});
