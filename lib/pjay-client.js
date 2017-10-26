const XError = require('xerror');
const { PassThrough } = require('zstreams');
const utils = require('./utils');

require('./error-codes');

class PjayClient {
	constructor(settings = {}) {
		this.settings = settings;
	}

	getRequestSettings(method, params, id) {
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

	request(method, params, id) {
		let requestSettings = this.getRequestSettings(method, params, id);
		return utils.request(requestSettings)
			.catch((err) => {
				throw new XError(XError.REQUEST_FAILED, err);
			})
			.then(({ error, result }) => {
				if (error) {
					let { code, message, data } = error;
					throw new XError(code, message, data);
				}
				return result;
			});
	}

	requestStream(method, params, id) {
		let requestSettings = this.getRequestSettings(method, params, id);
		let successReceived = false;
		let passThrough = new PassThrough({ objectMode: true });
		utils.requestObjectStream(requestSettings)
			.each((obj) => {
				if (obj.data) passThrough.write(obj.data);
				if (obj.success) successReceived = true;
				if (obj.error) {
					let { code, message, data } = obj.error;
					throw new XError(code, message, data);
				}
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

module.exports = PjayClient;
