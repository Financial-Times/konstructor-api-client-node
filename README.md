
Konstructor API Client
======================

**:warning: this is a work-in-progress, don't use it yet :warning:**

Make Konstructor calls from the command-line and Node.js.

```sh
npm install -g konstructor-api-client
```

then

```sh
konstructor cr \
  --gateway test \
  --type releaselog \
  --owner-email me@example.com \
  --summary "Just testing" \
  --description "Testing description" \
  --service "origami-buildservice ServiceModule"
```

or

```js
const KonstructorApiClient = require('konstructor-api-client');
const apiClient = new KonstructorApiClient('test');

apiClient.createAndCloseChangeRequest('releaselog', {
	ownerEmailAddress: 'me@example.com',
	summaryOfChange: 'Just testing',
	changeDescription: 'Testing description',
	serviceIds: 'origami-buildservice ServiceModule'
}, {
	closedByEmailAddress: 'me@example.com'
});
```
