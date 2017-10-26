const { or } = require('common-schema');
const XError = require('xerror');

module.exports = function(router) {
	router.register(
		{
			method: 'test-request',
			schema: or(
				{ required: true },
				{ result: { type: 'mixed' } },
				{ error: {
					type: 'object',
					properties: {
						code: String,
						message: String,
						data: { type: 'mixed' }
					}
				} }
			)
		},
		(ctx) => {
			let { result, error } = ctx.params;
			if (error) throw new XError(error.code, error.message, error.data);
			return result;
		}
	);
};
