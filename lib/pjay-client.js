const XError = require('xerror');
const { PassThrough } = require('zstreams');
const utils = require('./utils');

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
			.then(({ error, result }) => {
				if (error) throw error;
				return result;
			});
	}

	requestStream(method, params, id) {
		let requestSettings = this.getRequestSettings(method, params, id);
		let successReceived = false;
		let passThrough = new PassThrough({ objectMode: true });
		utils.requestObjectStream(requestSettings)
			.each((obj) => {
				if (obj.error) throw obj.error;
				if (obj.success) successReceived = true;
				if (obj.data) passThrough.write(obj.data);
			})
			.intoPromise()
			.then(() => {
				if (!successReceived) {
					throw new XError(
						'Request stream ended before success indicator'
					);
				}
				passThrough.end();
			})
			.catch((error) => {
				passThrough.emit('error', error);
			});

		return passThrough;
	}
}

module.exports = PjayClient;
