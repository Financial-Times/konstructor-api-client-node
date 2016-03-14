'use strict';

const assert = require('proclaim');

describe('lib/ft-changerequest', () => {
	let changeRequest;

	beforeEach(() => {
		changeRequest = require('../../../lib/ft-changerequest');
	});

	it('should export a function', () => {
		assert.isFunction(changeRequest);
	});

	describe('changeRequest()', () => {
		let returnedPromise;

		beforeEach(() => {
			returnedPromise = changeRequest();
		});

		it('should return a promise', function() {
			assert.instanceOf(returnedPromise, Promise);
		});

	});

});
