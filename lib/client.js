const XError = require('xerror');
const { PassThrough } = require('zstreams');
const utils = require('./utils');

/**
 * Encapsulates JSON-RPC requests over HTTP.
 * @param {Object} settings - Client settings object.
 *   @param {String} uri - JSON-RPC endpoint uri.
 *   @param {Object} [settings.headers] - HTTP header fields to add to all
 *     requests, keyed by name.
 */
class Client {
	constructor(settings = {}) {
		this.settings = settings;
	}

	/**
	 * Gets an object containing full request settings for a JSON-RPC 2.0 call.
	 * @private
	 * @param {String} method - JSON-RPC method name.
	 * @param {Object} [params] - JSON-RPC 2.0 keyed parameters, if any.
	 * @param {String|Number} [id=uuid] - Identifier for the JSON-RPC call.
	 *   Defaults to an  RFC4122 v4 UUID.
	 * @returns {Object} - Request settings, as defined by the `request` module.
	 *   See https://www.npmjs.com/package/request.
	 */
	_getRequestSettings(method, params, id) {
		let { uri, headers } = this.settings;
		let requestSettings = {
			uri,
			method: 'POST',
			body: utils.getRequestObject(method, params, id),
			json: true
		};
		if (headers) requestSettings.headers = headers;
		return requestSettings;
	}

	/**
	 * Performs a JSON-RPC 2.0 call.
	 * @param {String} method - JSON-RPC method name.
	 * @param {Object} [params] - JSON-RPC 2.0 keyed parameters, if any.
	 * @param {String|Number} [id=uuid] - Identifier for the JSON-RPC call.
	 *   Defaults to an RFC4122 v4 UUID.
	 * @returns {Promise} - Will resolve with the result of the call, or
	 *   reject if there is an error.
	 */
	request(method, params, id) {
		let requestSettings = this._getRequestSettings(method, params, id);
		return utils.request(requestSettings)
			.catch((err) => {
				throw new XError(XError.REQUEST_FAILED, err);
			})
			.then(({ error, result }) => {
				if (error) throw utils.reviveError(error);
				return result;
			});
	}

	/**
	 * Performs a streaming request. This is not part of the JSON-RPC standard,
	 * and it uses a format established in the `yaar` module.
	 * See https://www.npmjs.com/package/yaar
	 * @param {String} method - JSON-RPC method name.
	 * @param {Object} [params] - JSON-RPC 2.0 keyed parameters, if any.
	 * @param {String|Number} [id=uuid] - Identifier for the JSON-RPC call.
	 *   Defaults to an RFC4122 v4 UUID.
	 * @returns {zstreams.Readable} - A readable stream that will output data
	 *   from the request until a success flag is encountered. It will also emit
	 *   an `error` event if an error is encountered, or if the stream ends
	 *   before a success flag is received.
	 *   See https://www.npmjs.com/package/zstreams
	 */
	requestStream(method, params, id) {
		let requestSettings = this._getRequestSettings(method, params, id);
		let successReceived = false;
		let passThrough = new PassThrough({ objectMode: true });
		utils.requestObjectStream(requestSettings)
			.each((obj) => {
				if (obj.data) passThrough.write(obj.data);
				if (obj.success) successReceived = true;
				if (obj.error) throw utils.reviveError(obj.error);
			})
			.intoPromise()
			.then(() => {
				if (!successReceived) throw new XError(XError.UNEXPECTED_END);
				passThrough.end();
			})
			.catch((error) => {
				passThrough.emit('error', error);
			});

		return passThrough;
	}
}

module.exports = Client;
