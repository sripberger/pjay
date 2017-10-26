const XError = require('xerror');

XError.registerErrorCode('request_failed', { message: 'Request failed.' });

XError.registerErrorCode('invalid_object', {
	message: 'Received invalid line from request stream.'
});

XError.registerErrorCode('unexpected_end', {
	message: 'Request stream ended before a success indicator was received.'
});
