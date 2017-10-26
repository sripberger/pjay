const { Client } = require('../../lib');
const child_process = require('child_process');
const path = require('path');
const XError = require('xerror');

describe('Client', function() {
	const apiPath = path.resolve(__dirname, '../bin/test-api.js');
	let api, port, client;

	before(function(done) {
		api = child_process.fork(apiPath);
		api.on('message', (msg) => {
			if (msg.listening) {
				({ port } = msg);
				done();
			} else {
				done(new Error(
					`Test API could not be started. Reason: ${msg.error}`
				));
			}
		});
	});

	after(function() {
		api.kill();
	});

	beforeEach(function() {
		client = new Client({
			uri: `http://localhost:${port}/v1/jsonrpc`
		});
	});

	describe('#request', function() {
		it('works with successful result', function() {
			let result = { foo: 'bar' };

			return client.request('test-request', { result })
				.then((res) => {
					expect(res).to.deep.equal(result);
				});
		});

		it('works with error result', function() {
			let error = {
				code: 'error_code',
				message: 'error message',
				data: { errorData: 'some error data' }
			};

			return client.request('test-request', { error })
				.then(() => {
					throw new Error('Promise should have rejected.');
				}, (err) => {
					expect(err).to.be.an.instanceof(XError);
					expect(err.code).to.equal(error.code);
					expect(err.message).to.equal(error.message);
					expect(err.data).to.deep.equal(error.data);
				});
		});
	});

	describe('#requestStream', function() {
		let data;

		beforeEach(function() {
			data = [ { foo: 'bar' }, { baz: 'qux' } ];
		});

		it('works with successful stream', function() {
			return client.requestStream('test-stream', { data })
				.intoArray()
				.then((array) => {
					expect(array).to.deep.equal(data);
				});
		});

		it('works with failed stream', function() {
			let error = { code: 'error_code', message: 'error message' };

			return client.requestStream('test-stream', { data, error })
				.intoArray()
				.then(() => {
					throw new Error('Promise should have rejected.');
				}, (err) => {
					expect(err).to.be.an.instanceof(XError);
					expect(err.code).to.equal(error.code);
					expect(err.message).to.equal(error.message);
				});
		});
	});
});
