const utils = require('./utils');

class PjayClient {
	constructor(settings = {}) {
		this.settings = settings;
	}

	request(method, params, id) {
		let { uri, headers } = this.settings;
		let req = {
			uri,
			method: 'POST',
			body: utils.getRequestObject(method, params, id),
			json: true
		};
		if (headers) req.headers = headers;
		return utils.request(req)
			.then(({ error, result }) => {
				if (error) throw error;
				return result;
			});
	}
}

module.exports = PjayClient;
