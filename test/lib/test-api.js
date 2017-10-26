const express = require('express');
const { APIRouter, JSONRPCInterface } = require('yaar');
const pasync = require('pasync');
const routes = require('../lib/routes');

class TestApi {
	start() {
		// Initialize router.
		this.router = new APIRouter();
		this.router.version(1).addInterface(new JSONRPCInterface());

		// Initialize express app.
		this.app = express();
		this.app.use(this.router.getExpressRouter());

		// Register routes.
		for (let fn of routes) fn(this.router);

		// Increment port from 8080 until a free one is found.
		this.isListening = false;
		this.port = 8080;
		return pasync.until(
			() => this.isListening || this.port > 65535,
			() => new Promise((resolve, reject) => {
				this.server = this.app.listen(this.port);
				this.server.on('listening', () => {
					this.isListening = true;
					resolve();
				});
				this.server.on('error', (err) => {
					if (err.code === 'EADDRINUSE') {
						this.port += 1;
						resolve();
					} else {
						reject(err);
					}
				});
			})
		)
			.then(() => {
				if (!this.isListening) {
					throw new Error('Could not listen on any port');
				}
			});
	}
}

module.exports = TestApi;
