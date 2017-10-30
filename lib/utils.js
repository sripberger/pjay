const XError = require('xerror');
const zstreams = require('zstreams');
const { SplitStream } = zstreams;

/**
 * Internal utility functions.
 * @name utils
 * @kind module
 * @private
 */

/**
 * Re-export of the `request-promise-native` module, for unit testing purposes.
 * See https://www.npmjs.com/package/request-promise-native
 */
exports.request = require('request-promise-native');

/**
 * Re-export of the `uuid` module, for unit testing purposes.
 * See https://www.npmjs.com/package/uuid
 */
exports.uuid = require('uuid');

/**
 * Gets a JSON-RPC 2.0 request object.
 * @param {String} method - JSON-RPC method name.
 * @param {Object} [params] - JSON-RPC 2.0 keyed parameters, if any.
 * @param {String|Number} [id=uuid] - Identifier for the JSON-RPC call.
 *   Defaults to an  RFC4122 v4 UUID.
 * @returns {Object} JSON-RPC 2.0 request object.
 */
exports.getRequestObject = function(method, params, id) {
	let obj = {
		jsonrpc: '2.0',
		method,
		id: id || exports.uuid(),
	};
	if (params) obj.params = params;
	return obj;
};

/**
 * Requests a streaming response, splitting the result on newline characters.
 * @param {Object} settings - Request settings as defined by the `request`
 *   module. See https://www.npmjs.com/package/request.
 * @returns {zstreams.Readable} - A readable stream that will output each line
 *   of the response until it is finished, or an error occurs. See
 *   https://www.npmjs.com/package/zstreams.
 */
exports.requestLineStream = function(settings) {
	return zstreams.request(settings)
		.pipe(new SplitStream('\n'));
};

/**
 * Requests a streaming response, splitting the result on newline characters
 * and parsing each line as JSON.
 * @param {Object} settings - Request settings as defined by the `request`
 *   module. See https://www.npmjs.com/package/request.
 * @returns {zstreams.Readable} - A readable stream that will output each parsed
     line of the response until it is finished, or an error occurs. See
 *   https://www.npmjs.com/package/zstreams.
 */
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

/**
 * Converts a plain object representing an XError instance-- such as one from a
 * JSON-RPC response-- into an XError. Supports the `code`, `message`, and
 * `data` properties.
 * @param {Object} obj - Plain object error.
 * @returns {XError} - Revived XError instance.
 */
exports.reviveError = function(obj) {
	return new XError(obj.code, obj.message, obj.data);
};
