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
		return utils.request(this.getRequestSettings(method, params, id))
			.then(({ error, result }) => {
				if (error) throw error;
				return result;
			});
	}
}

module.exports = PjayClient;
