'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const pkg = require('../../../package.json');
const sinon = require('sinon');

describe('lib/konstructor-api-client', () => {
	let KonstructorApiClient;
	let request;

	beforeEach(() => {
		request = require('../mock/request');
		mockery.registerMock('request', request);

		KonstructorApiClient = require('../../../lib/konstructor-api-client');
	});

	it('should export a function', () => {
		assert.isFunction(KonstructorApiClient);
	});

	it('should have a `getEmailFromUsername` method', () => {
		assert.isFunction(KonstructorApiClient.getEmailFromUsername);
		assert.strictEqual(KonstructorApiClient.getEmailFromUsername, require('../../../lib/email-from-username'));
	});

	describe('new KonstructorApiClient(gateway, apiKey)', () => {
		let instance;

		beforeEach(() => {
			instance = new KonstructorApiClient('konstructor', 'xxxxxx');
		});

		it('should return an object', () => {
			assert.isObject(instance);
		});

		describe('returned object', () => {

			it('should have an `apiKey` property set to the passed in key', () => {
				assert.isDefined(instance.apiKey);
				assert.strictEqual(instance.apiKey, 'xxxxxx');
			});

			it('should have a `gateway` property set to the passed in gateway', () => {
				assert.isDefined(instance.gateway);
				assert.strictEqual(instance.gateway, 'konstructor');
			});

			it('should have a `userAgent` property', () => {
				assert.isDefined(instance.userAgent);
				assert.strictEqual(instance.userAgent, `konstructor-api-client-node/${pkg.version}`);
			});

			it('should have a `request` method', () => {
				assert.isFunction(instance.request);
			});

			describe('.request(endpoint, options)', () => {
				const mockHostname = 'http://mock-gateway';
				const mockUserAgent = 'mock-user-agent';
				let mockResponse;
				let options;
				let returnedPromise;

				beforeEach(() => {
					mockResponse = {
						body: 'mock response body'
					};
					request.yieldsAsync(null, mockResponse, mockResponse.body);
					options = {
						method: 'MOCK'
					};
					instance.hostname = mockHostname;
					instance.userAgent = mockUserAgent;
					returnedPromise = instance.request('/foo/bar', options);
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

					it('should make a request to the configured gateway and endpoint', () => {
						assert.calledOnce(request);
						assert.isObject(request.firstCall.args[0]);
						assert.strictEqual(request.firstCall.args[0].url, mockHostname + '/foo/bar');
					});

					it('should honour the request options', () => {
						assert.strictEqual(request.firstCall.args[0].method, options.method);
					});

					it('should not send a Content-Type header', () => {
						assert.isObject(request.firstCall.args[0].headers);
						assert.isUndefined(request.firstCall.args[0].headers['Content-Type']);
					});

					it('should send an Accept header', () => {
						assert.isObject(request.firstCall.args[0].headers);
						assert.strictEqual(request.firstCall.args[0].headers['Accept'], 'application/json');
					});

					it('should send a User-Agent header equal to the `userAgent` property', () => {
						assert.isObject(request.firstCall.args[0].headers);
						assert.strictEqual(request.firstCall.args[0].headers['User-Agent'], mockUserAgent);
					});

					it('should request JSON', () => {
						assert.isTrue(request.firstCall.args[0].json);
					});

					it('should resolve with the response body', () => {
						assert.strictEqual(resolvedValue, mockResponse.body);
					});

				});

				describe('when the request method is POST', () => {

					beforeEach(() => {
						request.resetHistory();
						options.method = 'POST';
						returnedPromise = instance.request('/foo/bar', options);
					});

					describe('.then()', () => {

						beforeEach(() => {
							return returnedPromise;
						});

						it('should send a Content-Type header of `application/x-www-form-urlencoded`', () => {
							assert.strictEqual(request.firstCall.args[0].headers['Content-Type'], 'application/x-www-form-urlencoded');
						});

					});

				});

				describe('when the request errors', () => {
					let requestError;

					beforeEach(() => {
						requestError = new Error('request error');
						request.yieldsAsync(requestError);
						returnedPromise = instance.request('/foo/bar', options);
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

				describe('when the response has a non-2xx status', () => {

					beforeEach(() => {
						request.yieldsAsync(null, {
							statusCode: 400
						});
						returnedPromise = instance.request('/foo/bar', options);
					});

					describe('.catch()', () => {
						let caughtError;

						beforeEach(done => {
							returnedPromise.then(done).catch(error => {
								caughtError = error;
								done();
							});
						});

						it('should fail with a status error', () => {
							assert.instanceOf(caughtError, Error);
							assert.strictEqual(caughtError.message, 'API responded with a 400 status');
						});

					});

				});

			});

			it('should have a `sanitizeChangeRequestCreation` method', () => {
				assert.isFunction(instance.sanitizeChangeRequestCreation);
			});

			describe('.sanitizeChangeRequestCreation(type, data)', () => {
				let data;
				let returnedPromise;
				let type;

				beforeEach(() => {
					type = 'normal';
					data = {
						ownerEmailAddress: 'test email',
						summaryOfChange: 'test summary',
						changeDescription: 'test description',
						reasonForChangeDetails: 'test reason',
						changeCategory: 'test category',
						riskProfile: 'test risk profile',
						environment: 'test environment',
						willThereBeAnOutage: 'Yes',
						resourceOne: 'test resource',
						serviceIds: 'test service id',
						notifyChannel: '#test-channel',
						notify: true
					};
					returnedPromise = instance.sanitizeChangeRequestCreation(type, data);
				});

				it('should return a promise', () => {
					assert.isObject(returnedPromise);
					assert.isFunction(returnedPromise.then);
					assert.isFunction(returnedPromise.catch);
				});

				describe('.then()', () => {
					let resolvedValue;

					beforeEach(done => {
						returnedPromise.then(value => {
							resolvedValue = value;
							done();
						}).catch(done);
					});

					it('should resolve with an object equal to `data` when all properties are set', () => {
						assert.isObject(resolvedValue);
						assert.notStrictEqual(resolvedValue, data);
						assert.deepEqual(resolvedValue, data);
					});

					it('should default the `reasonForChangeDetails` property', done => {
						instance.sanitizeChangeRequestCreation(type, {}).then(value => {
							assert.strictEqual(value.reasonForChangeDetails, 'Deployment');
							done();
						}).catch(done);
					});

					it('should default the `changeCategory` property', done => {
						instance.sanitizeChangeRequestCreation(type, {}).then(value => {
							assert.strictEqual(value.changeCategory, 'Minor');
							done();
						}).catch(done);
					});

					it('should default the `riskProfile` property', done => {
						instance.sanitizeChangeRequestCreation(type, {}).then(value => {
							assert.strictEqual(value.riskProfile, 'Low');
							done();
						}).catch(done);
					});

					it('should default the `environment` property', done => {
						instance.sanitizeChangeRequestCreation(type, {}).then(value => {
							assert.strictEqual(value.environment, 'Test');
							done();
						}).catch(done);
					});

					it('should default the `willThereBeAnOutage` property', done => {
						instance.sanitizeChangeRequestCreation(type, {}).then(value => {
							assert.strictEqual(value.willThereBeAnOutage, 'No');
							done();
						}).catch(done);
					});

					it('should convert the `willThereBeAnOutage` property from `true`', done => {
						instance.sanitizeChangeRequestCreation(type, {
							willThereBeAnOutage: true
						})
						.then(value => {
							assert.strictEqual(value.willThereBeAnOutage, 'Yes');
							done();
						})
						.catch(done);
					});

					it('should convert the `willThereBeAnOutage` property from `false`', done => {
						instance.sanitizeChangeRequestCreation(type, {
							willThereBeAnOutage: false
						})
						.then(value => {
							assert.strictEqual(value.willThereBeAnOutage, 'No');
							done();
						})
						.catch(done);
					});

					it('should not convert the `willThereBeAnOutage` property from `No` to `Yes`', done => {
						instance.sanitizeChangeRequestCreation(type, {
							willThereBeAnOutage: 'No'
						})
						.then(value => {
							assert.strictEqual(value.willThereBeAnOutage, 'No');
							done();
						})
						.catch(done);
					});

					it('should default the `notify` property to `false`', done => {
						instance.sanitizeChangeRequestCreation(type, {}).then(value => {
							assert.isFalse(value.notify);
							done();
						}).catch(done);
					});

					it('should default the `notify` property to `true` when `notifyChannel` is present', done => {
						instance.sanitizeChangeRequestCreation(type, {
							notifyChannel: '#test-channel'
						})
						.then(value => {
							assert.isTrue(value.notify);
							done();
						})
						.catch(done);
					});

					it('should prepend a "#" to the `notifyChannel` property when one is not present', done => {
						instance.sanitizeChangeRequestCreation(type, {
							notifyChannel: 'test-channel'
						})
						.then(value => {
							assert.strictEqual(value.notifyChannel, '#test-channel');
							done();
						})
						.catch(done);
					});

				});

				describe('when `type` is not valid', () => {
					returnedPromise;

					beforeEach(() => {
						returnedPromise = instance.sanitizeChangeRequestCreation('not-a-type', data);
					});

					describe('.catch()', () => {
						let caughtError;

						beforeEach(done => {
							returnedPromise.then(done).catch(error => {
								caughtError = error;
								done();
							});
						});

						it('should fail with the expected error', () => {
							assert.instanceOf(caughtError, Error);
							assert.strictEqual(caughtError.message, 'Change request type must be one of "emergency", "fyi", "normal", "releaselog"');
						});

					});

				});

			});

			it('should have a `sanitizeChangeRequestClosure` method', () => {
				assert.isFunction(instance.sanitizeChangeRequestClosure);
			});

			describe('.sanitizeChangeRequestClosure(type, data)', () => {
				let data;
				let returnedPromise;

				beforeEach(() => {
					data = {
						closedByEmailAddress: 'test email',
						closeCategory: 'test category',
						notifyChannel: '#test-channel',
						notify: true
					};
					returnedPromise = instance.sanitizeChangeRequestClosure(data);
				});

				it('should return a promise', () => {
					assert.isObject(returnedPromise);
					assert.isFunction(returnedPromise.then);
					assert.isFunction(returnedPromise.catch);
				});

				describe('.then()', () => {
					let resolvedValue;

					beforeEach(done => {
						returnedPromise.then(value => {
							resolvedValue = value;
							done();
						}).catch(done);
					});

					it('should resolve with an object equal to `data` when all properties are set', () => {
						assert.isObject(resolvedValue);
						assert.notStrictEqual(resolvedValue, data);
						assert.deepEqual(resolvedValue, data);
					});

					it('should default the `closeCategory` property', done => {
						instance.sanitizeChangeRequestClosure({}).then(value => {
							assert.strictEqual(value.closeCategory, 'Implemented');
							done();
						}).catch(done);
					});

					it('should default the `notify` property to `false`', done => {
						instance.sanitizeChangeRequestClosure({}).then(value => {
							assert.isFalse(value.notify);
							done();
						}).catch(done);
					});

					it('should default the `notify` property to `true` when `notifyChannel` is present', done => {
						instance.sanitizeChangeRequestClosure({
							notifyChannel: '#test-channel'
						})
						.then(value => {
							assert.isTrue(value.notify);
							done();
						})
						.catch(done);
					});

					it('should prepend a "#" to the `notifyChannel` property when one is not present', done => {
						instance.sanitizeChangeRequestClosure({
							notifyChannel: 'test-channel'
						})
						.then(value => {
							assert.strictEqual(value.notifyChannel, '#test-channel');
							done();
						})
						.catch(done);
					});

				});

			});

			it('should have a `createChangeRequest` method', () => {
				assert.isFunction(instance.createChangeRequest);
			});

			describe('.createChangeRequest(type, data)', () => {
				let data;
				let mockApiResponseBody;
				let returnedPromise;
				let type;

				beforeEach(() => {
					type = 'mock-type';
					data = {
						foo: 'bar'
					};
					mockApiResponseBody = {
						changeRequests: [
							{
								id: 'CRID'
							}
						]
					};
					instance.request = sinon.stub().resolves(mockApiResponseBody);
					instance.sanitizeChangeRequestCreation = sinon.stub().resolves(data);
					returnedPromise = instance.createChangeRequest(type, data);
				});

				it('should return a promise', () => {
					assert.isObject(returnedPromise);
					assert.isFunction(returnedPromise.then);
					assert.isFunction(returnedPromise.catch);
				});

				it('should call `sanitizeChangeRequestCreation` with `type` and `data`', () => {
					assert.calledOnce(instance.sanitizeChangeRequestCreation);
					assert.calledWithExactly(instance.sanitizeChangeRequestCreation, type, data);
				});

				describe('.then()', () => {
					let resolvedValue;

					beforeEach(done => {
						returnedPromise.then(value => {
							resolvedValue = value;
							done();
						}).catch(done);
					});

					it('should make a POST request to `/v1/changerequest/:type`', () => {
						assert.calledOnce(instance.request);
						assert.calledWith(instance.request, `/v1/changerequest/${type}`);
						assert.isObject(instance.request.firstCall.args[1]);
						assert.strictEqual(instance.request.firstCall.args[1].method, 'POST');
					});

					it('should include `data` as a URL-encoded request body', () => {
						assert.strictEqual(instance.request.firstCall.args[1].body, 'foo=bar');
					});

					it('should resolve with the first change request in the response', () => {
						assert.strictEqual(resolvedValue, mockApiResponseBody.changeRequests[0]);
					});

				});

			});

			it('should have a `closeChangeRequest` method', () => {
				assert.isFunction(instance.closeChangeRequest);
			});

			describe('.closeChangeRequest(id, data)', () => {
				let id;
				let data;
				let mockApiResponseBody;
				let returnedPromise;

				beforeEach(() => {
					id = 'mock-id';
					data = {
						foo: 'bar'
					};
					mockApiResponseBody = {
						changeRequests: [
							{
								id: 'CRID'
							}
						]
					};
					instance.request = sinon.stub().resolves(mockApiResponseBody);
					instance.sanitizeChangeRequestClosure = sinon.stub().resolves(data);
					returnedPromise = instance.closeChangeRequest(id, data);
				});


				it('should return a promise', () => {
					assert.isObject(returnedPromise);
					assert.isFunction(returnedPromise.then);
					assert.isFunction(returnedPromise.catch);
				});

				it('should call `sanitizeChangeRequestClosure` with `data`', () => {
					assert.calledOnce(instance.sanitizeChangeRequestClosure);
					assert.calledWithExactly(instance.sanitizeChangeRequestClosure, data);
				});

				describe('.then()', () => {
					let resolvedValue;

					beforeEach(done => {
						returnedPromise.then(value => {
							resolvedValue = value;
							done();
						}).catch(done);
					});

					it('should make a POST request to `/v1/changerequest/close/:id`', () => {
						assert.calledOnce(instance.request);
						assert.calledWith(instance.request, `/v1/changerequest/close/${id}`);
						assert.isObject(instance.request.firstCall.args[1]);
						assert.strictEqual(instance.request.firstCall.args[1].method, 'POST');
					});

					it('should include `data` as a URL-encoded request body', () => {
						assert.strictEqual(instance.request.firstCall.args[1].body, 'foo=bar');
					});

					it('should resolve with the first change request in the response', () => {
						assert.strictEqual(resolvedValue, mockApiResponseBody.changeRequests[0]);
					});

				});

			});

			it('should have a `createAndCloseChangeRequest` method', () => {
				assert.isFunction(instance.createAndCloseChangeRequest);
			});

			describe('.createAndCloseChangeRequest(type, openData, closeData)', () => {
				let closeData;
				let closedChangeRequest;
				let openData;
				let openedChangeRequest;
				let returnedPromise;
				let type;

				beforeEach(() => {
					type = 'mock-type';
					openData = {
						open: true
					};
					closeData = {
						close: true
					};
					openedChangeRequest = {
						id: 'CRID-O'
					};
					closedChangeRequest = {
						id: 'CRID-C'
					};
					instance.createChangeRequest = sinon.stub().resolves(openedChangeRequest);
					instance.closeChangeRequest = sinon.stub().resolves(closedChangeRequest);
					returnedPromise = instance.createAndCloseChangeRequest(type, openData, closeData);
				});

				it('should return a promise', () => {
					assert.isObject(returnedPromise);
					assert.isFunction(returnedPromise.then);
					assert.isFunction(returnedPromise.catch);
				});

				describe('.then()', () => {
					let resolvedValue;

					beforeEach(done => {
						returnedPromise.then(value => {
							resolvedValue = value;
							done();
						}).catch(done);
					});

					it('should call `createChangeRequest` with the expected type and data', () => {
						assert.calledOnce(instance.createChangeRequest);
						assert.calledWithExactly(instance.createChangeRequest, type, openData);
					});

					it('should call `closeChangeRequest` with the expected id and data', () => {
						assert.calledOnce(instance.closeChangeRequest);
						assert.calledWithExactly(instance.closeChangeRequest, openedChangeRequest.id, closeData);
					});

					it('should resolve with the closed change request', () => {
						assert.strictEqual(resolvedValue, closedChangeRequest);
					});

				});

			});

		});

		describe('when `gateway` is "internal"', () => {

			beforeEach(() => {
				instance = new KonstructorApiClient('internal', 'xxxxxx');
			});

			it('should not error when `apiKey` is missing', () => {
				assert.doesNotThrow(() => {
					new KonstructorApiClient('internal');
				});
			});

			describe('returned object', () => {

				it('should have a `hostname` property set to the gateway\'s corresponding hostname', () => {
					assert.isDefined(instance.hostname);
					assert.strictEqual(instance.hostname, 'http://konstructor.svc.ft.com');
				});

				describe('.request(endpoint, options)', () => {
					let returnedPromise;

					beforeEach(() => {
						request.yieldsAsync(null, {}, '');
						returnedPromise = instance.request('/foo/bar', {});
					});

					describe('.then()', () => {

						beforeEach(done => {
							returnedPromise.then(() => {
								done();
							}).catch(done);
						});

						it('should not specify an Authorization header', () => {
							assert.isUndefined(request.firstCall.args[0].headers.Authorization);
						});

						it('should not specify an X-Api-Key header', () => {
							assert.isUndefined(request.firstCall.args[0].headers['X-Api-Key']);
						});

					});

				});

			});

		});

		describe('when `gateway` is "konstructor"', () => {

			beforeEach(() => {
				instance = new KonstructorApiClient('konstructor', 'xxxxxx');
			});

			it('should throw an error when `apiKey` is missing', () => {
				assert.throws(() => {
					new KonstructorApiClient('konstructor');
				}, 'Konstructor API key is required for the "konstructor" gateway');
			});

			describe('returned object', () => {

				it('should have a `hostname` property set to the gateway\'s corresponding hostname', () => {
					assert.isDefined(instance.hostname);
					assert.strictEqual(instance.hostname, 'https://konstructor.ft.com');
				});

				describe('.request(endpoint, options)', () => {
					let returnedPromise;

					beforeEach(() => {
						request.yieldsAsync(null, {}, '');
						returnedPromise = instance.request('/foo/bar', {});
					});

					describe('.then()', () => {

						beforeEach(done => {
							returnedPromise.then(() => {
								done();
							}).catch(done);
						});

						it('should specify an Authorization header, set to `apiKey`', () => {
							assert.strictEqual(request.firstCall.args[0].headers.Authorization, 'xxxxxx');
						});

						it('should not specify an X-Api-Key header', () => {
							assert.isUndefined(request.firstCall.args[0].headers['X-Api-Key']);
						});

					});

				});

			});

		});

		describe('when `gateway` is "mashery"', () => {

			beforeEach(() => {
				instance = new KonstructorApiClient('mashery', 'xxxxxx');
			});

			it('should throw an error when `apiKey` is missing', () => {
				assert.throws(() => {
					new KonstructorApiClient('mashery');
				}, 'Konstructor API key is required for the "mashery" gateway');
			});

			describe('returned object', () => {

				it('should have a `hostname` property set to the gateway\'s corresponding hostname', () => {
					assert.isDefined(instance.hostname);
					assert.strictEqual(instance.hostname, 'https://api.ft.com/konstructor');
				});

				describe('.request(endpoint, options)', () => {
					let returnedPromise;

					beforeEach(() => {
						request.yieldsAsync(null, {}, '');
						returnedPromise = instance.request('/foo/bar', {});
					});

					describe('.then()', () => {

						beforeEach(done => {
							returnedPromise.then(() => {
								done();
							}).catch(done);
						});

						it('should specify an X-Api-Key header, set to `apiKey`', () => {
							assert.strictEqual(request.firstCall.args[0].headers['X-Api-Key'], 'xxxxxx');
						});

						it('should not specify an Authorization header', () => {
							assert.isUndefined(request.firstCall.args[0].headers.Authorization);
						});

					});

				});

			});

		});

		describe('when `gateway` is "test"', () => {

			beforeEach(() => {
				instance = new KonstructorApiClient('test', 'xxxxxx');
			});

			it('should not error when `apiKey` is missing', () => {
				assert.doesNotThrow(() => {
					new KonstructorApiClient('test');
				});
			});

			describe('returned object', () => {

				it('should have a `hostname` property set to the gateway\'s corresponding hostname', () => {
					assert.isDefined(instance.hostname);
					assert.strictEqual(instance.hostname, 'http://test.konstructor.svc.ft.com');
				});

				describe('.request(endpoint, options)', () => {
					let returnedPromise;

					beforeEach(() => {
						request.yieldsAsync(null, {}, '');
						returnedPromise = instance.request('/foo/bar', {});
					});

					describe('.then()', () => {

						beforeEach(done => {
							returnedPromise.then(() => {
								done();
							}).catch(done);
						});

						it('should not specify an Authorization header', () => {
							assert.isUndefined(request.firstCall.args[0].headers.Authorization);
						});

						it('should not specify an X-Api-Key header', () => {
							assert.isUndefined(request.firstCall.args[0].headers['X-Api-Key']);
						});

					});

				});

			});

		});

		describe('when `gateway` is unrecognised', () => {

			it('should throw an error', () => {
				assert.throws(() => {
					new KonstructorApiClient('foo', 'xxxxxx');
				}, 'Gateway must be one of "mashery", "konstructor", or "internal"');
			});

		});

		describe('when `gateway` is not defined', () => {

			it('should throw an error', () => {
				assert.throws(() => {
					new KonstructorApiClient();
				}, 'Gateway is required');
			});

		});

	});

});
