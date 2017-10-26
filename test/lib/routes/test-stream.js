const XError = require('xerror');
const { PassThrough, ArrayReadableStream } = require('zstreams');

module.exports = function(router) {
	router.register(
		{
			method: 'test-stream',
			streamingResponse: true,
			schema: {
				data: {
					type: 'array',
					elements: { type: 'mixed' },
					default: []
				},
				error: {
					type: 'object',
					properties: {
						code: String,
						message: String
					}
				}
			}
		},
		(ctx) => {
			let { data, error } = ctx.params;
			let output = new PassThrough({ objectMode: true });
			let dataStream = new ArrayReadableStream(data);

			dataStream.each((element) => {
				output.write({ data: element });
			});

			dataStream.on('end', () => {
				if (error) {
					output.emit('error', new XError(error.code, error.message));
				} else {
					output.end();
				}
			});

			return output;
		}
	);
};
