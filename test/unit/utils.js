const utils = require('../../lib/utils');
const rpn = require('request-promise-native');
const uuid = require('uuid');
const zstreams = require('zstreams');
const { ArrayReadableStream } = zstreams;

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

	describe('::requestLineStream', function() {
		it('requests a stream split on line endings', function() {
			let settings = { setting: 'some setting' };
			sandbox.stub(zstreams, 'request').returns(
				new ArrayReadableStream([
					'foo-bar-',
					'baz\nqux\n',
					'baz-bar\n',
					'foo\n'
				])
			);

			return utils.requestLineStream(settings)
				.intoArray()
				.then((result) => {
					expect(zstreams.request).to.be.calledOnce;
					expect(zstreams.request).to.be.calledOn(zstreams);
					expect(zstreams.request).to.be.calledWith(settings);
					expect(result).to.deep.equal([
						'foo-bar-baz',
						'qux',
						'baz-bar',
						'foo'
					]);
				});
		});
	});

	describe('::requestObjectStream', function() {
		it('request a line stream, with each line parsed as json', function() {
			let settings = { setting: 'some setting' };
			sandbox.stub(utils, 'requestLineStream').returns(
				new ArrayReadableStream([
					'{"foo":"bar"}',
					'{"baz": "qux"}'
				])
			);

			return utils.requestObjectStream(settings)
				.intoArray()
				.then((result) => {
					expect(utils.requestLineStream).to.be.calledOnce;
					expect(utils.requestLineStream).to.be.calledOn(utils);
					expect(utils.requestLineStream).to.be.calledWith(settings);
					expect(result).to.deep.equal([
						{ foo: 'bar' },
						{ baz: 'qux' }
					]);
				});
		});
	});
});
