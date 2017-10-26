#!/usr/bin/env node

const TestApi = require('../lib/test-api');

let api = new TestApi();
api.start()
	.then(() => {
		process.send({ listening: true, port: api.port });
	})
	.catch((err) => {
		process.send({ listening: false, error: err.message });
		process.exit(1);
	});
