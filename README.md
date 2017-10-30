# pjay

A simple, promise-oriented client for JSON-RPC 2.0 over HTTP, with support for
non-standard streaming responses as defined by
[yaar](https://www.npmjs.com/package/yaar).


## Basic Usage

JSON-RPC calls are encapsulated by the `pjay.Client` class and its `#request`
method:

```js
const { Client } = require('pjay');

let client = new Client({
	uri: 'http://host/path/to/jsonrpc/endpoint',
	headers: {
		// HTTP header fields to include with requests, if any.
	}
});

client.request('some-method', { /* keyed params here */ })
	.then((result) => {
		// Will resolve with the result.
	}, (err) => {
		// Will instead reject with error, if any occurred.
	});
```


## Streaming Usage

JSON-RPC includes no standard for streaming responses.
[yaar](https://www.npmjs.com/package/yaar) allows them, however, and they take
following form:

- Results are streamed as newline-delineated JSON.
- Each result object has either a `data` property or a `success` property:
  - Objects with `data` properties are actual streamed results, the values of
    which will be the values of the `data` properties.
  - An object with a `success` property will indicate the end of the stream.
    `success` will be a boolean indicating whether the stream was completed
    successfully. If false, it should be accompanied by an `error` property,
    indicating what went wrong.

Such a streaming response can be consumed using the `Client#requestStream`
method, which returns a [zstreams](https://www.npmjs.com/package/zstreams)
Readable:

```js
client.requestStream('some-streaming-method', { /* keyed params here */ })
	.through((data) => `${JSON.stringify(data)}\n`)
	.intoFile('/path/to/file')
	.then(() => {
		// Will resolve when all data has been written to the file.
	}, (err) => {
		// Will instead reject with error, if any occurred.
	});
```

`pjay` will ignore any valid JSON object that lacks all three of the `data`,
`success`, and `error` properties. If it receives a line of invalid JSON,
however, it will cause the stream to emit a parsing error before ending.


## Other Libraries

`pjay` is effectively a heavily stripped-down version of
[zipscene-api-client](https://www.npmjs.com/package/zipscene-api-client), with
all of the Zipscene-specific authentication features removed. It can be used to
consume similar API's without requiring the use of Zipscene's proprietary
authentication services.
