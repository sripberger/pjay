const PjayClient = require('../../lib/pjay-client');
const { ArrayReadableStream } = require('zstreams');
const utils = require('../../lib/utils');
const XError = require('xerror');

describe('PjayClient', function() {
	it('stores provided settings', function() {
		let settings = { foo: 'bar' };

		let client = new PjayClient(settings);

		expect(client.settings).to.equal(settings);
	});

	it('defaults to empty settings object', function() {
		let client = new PjayClient();

		expect(client.settings).to.deep.equal({});
	});

	describe('#getRequestSettings', function() {
		const method = 'some-method';
		const id = 'some-id';
		let client, params, requestObject;

		beforeEach(function() {
			client = new PjayClient({ uri: 'some-uri' });
			params = { param: 'some-param' };
			requestObject = { id: 'request-object' };
			sandbox.stub(utils, 'getRequestObject').returns(requestObject);
		});

		it('returns request settings object from instance settings and args', function() {
			let result = client.getRequestSettings(method, params, id);

			expect(utils.getRequestObject).to.be.calledOnce;
			expect(utils.getRequestObject).to.be.calledOn(utils);
			expect(utils.getRequestObject).to.be.calledWith(method, params, id);
			expect(result).to.deep.equal({
				method: 'POST',
				uri: client.settings.uri,
				body: requestObject,
				json: true
			});
		});

		it('includes headers from instance settings, if any', function() {
			client.settings.headers = { header: 'some-header' };

			let result = client.getRequestSettings(method, params, id);

			expect(utils.getRequestObject).to.be.calledOnce;
			expect(utils.getRequestObject).to.be.calledOn(utils);
			expect(utils.getRequestObject).to.be.calledWith(method, params, id);
			expect(result).to.deep.equal({
				uri: client.settings.uri,
				method: 'POST',
				headers: client.settings.headers,
				body: requestObject,
				json: true
			});
		});
	});

	describe('#request', function() {
		const method = 'some-method';
		const id = 'some-id';
		let client, params, requestSettings, methodResult;

		beforeEach(function() {
			client = new PjayClient();
			params = { param: 'some-param' };
			requestSettings = { settings: 'request-settings' };
			methodResult = { id: 'method-result' };
			sandbox.stub(client, 'getRequestSettings').returns(requestSettings);
			sandbox.stub(utils, 'request').resolves({
				error: null,
				result: methodResult
			});
		});

		it('performs request and resolves with method result', function() {
			return client.request(method, params, id)
				.then((result) => {
					expect(client.getRequestSettings).to.be.calledOnce;
					expect(client.getRequestSettings).to.be.calledOn(client);
					expect(client.getRequestSettings).to.be.calledWith(
						method,
						params,
						id
					);
					expect(utils.request).to.be.calledOnce;
					expect(utils.request).to.be.calledOn(utils);
					expect(utils.request).to.be.calledWith(requestSettings);
					expect(result).to.equal(methodResult);
				});
		});


		it('rejects with method error, if any', function() {
			let methodError = new Error('method error');
			utils.request.resolves({ error: methodError, result: null });

			return client.request(method, params, id)
				.then(() => {
					throw new Error('Promise should have rejected.');
				}, (err) => {
					expect(err).to.equal(methodError);
				});
		});
	});

	describe('#requestStream', function() {
		const method = 'some-method';
		const id = 'some-id';
		let client, params, requestSettings;

		beforeEach(function() {
			client = new PjayClient();
			params = { param: 'some param' };
			requestSettings = { setting: 'some request setting' };
			sandbox.stub(client, 'getRequestSettings').returns(requestSettings);
			sandbox.stub(utils, 'requestObjectStream').returns(
				new ArrayReadableStream([
					{ data: { foo: 'bar' } },
					{ data: { baz: 'qux' } },
					{ success: true }
				])
			);
		});

		it('returns a stream of data objects', function() {
			return client.requestStream(method, params, id)
				.intoArray()
				.then((result) => {
					expect(client.getRequestSettings).to.be.calledOnce;
					expect(client.getRequestSettings).to.be.calledOn(client);
					expect(client.getRequestSettings).to.be.calledWith(
						method,
						params,
						id
					);
					expect(utils.requestObjectStream).to.be.calledOnce;
					expect(utils.requestObjectStream).to.be.calledOn(utils);
					expect(utils.requestObjectStream).to.be.calledWith(
						requestSettings
					);
					expect(result).to.deep.equal([
						{ foo: 'bar' },
						{ baz: 'qux' }
					]);
				});
		});

		it('throws stream error object, if any', function() {
			let streamError = new Error('stream error');
			utils.requestObjectStream.returns(
				new ArrayReadableStream([
					{ data: { foo: 'bar' } },
					{ data: { baz: 'qux' } },
					{ error: streamError }
				])
			);

			return client.requestStream(method, params, id)
				.intoArray()
				.then(() => {
					throw new Error('Promise should have rejected');
				}, (err) => {
					expect(err).to.equal(streamError);
				});
		});

		it('throws if stream ends before success object', function() {
			utils.requestObjectStream.returns(
				new ArrayReadableStream([
					{ data: { foo: 'bar' } },
					{ data: { baz: 'qux' } }
				])
			);

			return client.requestStream(method, params, id)
				.intoArray()
				.then(() => {
					throw new Error('Promise should have rejected');
				}, (err) => {
					expect(err).to.be.an.instanceof(XError);
					expect(err.code).to.equal(XError.INTERNAL_ERROR);
					expect(err.message).to.equal(
						'Request stream ended before success indicator'
					);
				});
		});
	});
});
