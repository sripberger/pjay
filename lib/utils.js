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
