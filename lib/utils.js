const zstreams = require('zstreams');
const { SplitStream } = zstreams;

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
		.through((line) => JSON.parse(line));
};
