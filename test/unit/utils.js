const utils = require('../../lib/utils');
const rpn = require('request-promise-native');
const uuid = require('uuid');

describe('utils', function() {
	describe('::request', function() {
		it('is request-promise-native module', function() {
			expect(utils.request).to.equal(rpn);
		});
	});

	describe('::uuid', function() {
		it('is uuid module', function() {
			expect(utils.uuid).to.equal(uuid);
		});
	});

	describe('::getRequestObject', function() {
		const method = 'some-method';
		const params = { foo: 'bar' };
		const id = 'some-id';

		it('returns a JSON-RPC request object from arguments', function() {
			let result = utils.getRequestObject(method, params, id);

			expect(result).to.deep.equal({
				jsonrpc: '2.0',
				method,
				params,
				id
			});
		});

		it('uses uuid for default id', function() {
			sandbox.spy(utils, 'uuid');

			let result = utils.getRequestObject(method, params);

			expect(utils.uuid).to.be.calledOnce;
			expect(utils.uuid).to.be.calledOn(utils);
			expect(result).to.deep.equal({
				jsonrpc: '2.0',
				method,
				params,
				id: utils.uuid.firstCall.returnValue
			});
		});

		it('omits falsy params', function() {
			let result = utils.getRequestObject(method, null, id);

			expect(result).to.deep.equal({
				jsonrpc: '2.0',
				method,
				id
			});
		});
	});
});
