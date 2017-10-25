const PjayClient = require('../../lib/pjay-client');
const utils = require('../../lib/utils');

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
			let result = client.getRequestSettings(method, params, id)

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

			let result = client.getRequestSettings(method, params, id)

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
		let client, params, requestObject, methodResult;

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
});
