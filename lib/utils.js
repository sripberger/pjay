const XError = require('xerror');
const zstreams = require('zstreams');
const { SplitStream } = zstreams;

require('./error-codes');

exports.request = require('request-promise-native');
exports.uuid = require('uuid');

exports.getRequestObject = function(method, params, id) {
	let obj = {
		jsonrpc: '2.0',
		method,
		id: id || exports.uuid(),
	};
	if (params) obj.params = params;
	return obj;
};

exports.requestLineStream = function(settings) {
	return zstreams.request(settings)
		.pipe(new SplitStream('\n'));
};

exports.requestObjectStream = function(settings) {
	return exports.requestLineStream(settings)
		.through((line) => {
			try {
				return JSON.parse(line);
			} catch(err) {
				throw new XError(
					XError.INVALID_OBJECT,
					'Received invalid JSON line from request stream.',
					{ line },
					err
				);
			}
		});
};
