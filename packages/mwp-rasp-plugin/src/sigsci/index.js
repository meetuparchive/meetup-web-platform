// Signal Science NodeJS plugin
// This was grabbed from the source provided by Signal Science, this is needed
// as our current code requires Hapi 17 and this code is optimized for Hapi 14
// https://docs.signalsciences.net/install-guides/nodejs-module/

/*
 * NodeJS Module
 *
 * Copyright (c) 2017 Signal Sciences Corp.
 *
 * Proprietary and Confidential - Do Not Distribute
 *
 */

/* jslint node: true */
'use strict';

/* jshint bitwise: true, curly: true, eqeqeq: true */
/* jshint freeze: true, funcscope: true, futurehostile: true */
/* jshint latedef: true, noarg: true, nocomma: true, nonbsp: true */
/* jshint nonew: true, notypeof: true, singleGroups: true */
/* jshint undef: true, unused: true */
/* jshint asi:true */

var Session = require('msgpack5rpc');
var net = require('net');
var util = require('util');
var stream = require('stream');

// default parameters
var defaultOptions = {
	// path specifies the UDS to connect to the agent
	path: '/var/run/sigsci.sock',

	// maxPostSize - if a POST body is larger than maxPostSize
	//  the post body is NOT sent to the agent.
	maxPostSize: 100000,

	// socketTime - if the agent does not respond in this number of
	//   milliseconds, "fail open" and allow the request to pass
	socketTimeout: 100 /* milliseconds */,

	// HTTP methods that should be ignore, and allowed to pass-through
	// unlikely this needs to be changed.
	ignoreMethods: {
		OPTIONS: true,
		CONNECT: true,
	},

	// HTTP methods that can contain a body.  Unlikely this needs to be
	// changed.
	bodyMethods: {
		POST: true,
		PUT: true,
		PATCH: true,
	},

	// TK
	anomalySize: 524288,

	// TK
	anomalyDuration: 1000 /* milliseconds */,

	// Enable debug log
	debug: false,

	// log function to use
	log: function(msg) {
		console.log(util.format('SIGSCI %s', msg));
	},
};

// Utility functinon to merge two objects into another.
// Used for setting default values.
// from http://stackoverflow.com/a/8625261
var merge = function() {
	var obj = {};
	var i = 0;
	var il = arguments.length;
	var key;
	for (; i < il; i++) {
		for (key in arguments[i]) {
			if (arguments[i].hasOwnProperty(key)) {
				obj[key] = arguments[i][key];
			}
		}
	}
	return obj;
};

// rawHeadersToPairs converts a nodejs raw header list
// to a list of pairs expected in the protocol.
var rawHeadersToPairs = function(raw) {
	var out = [];
	var n = raw.length;
	for (var i = 0; i < n; i += 2) {
		out.push([raw[i], raw[i + 1]]);
	}
	return out;
};

var headersToPairs = function(raw) {
	var out = [];
	for (var key in raw) {
		out.push([key, raw[key]]);
	}
	return out;
};

var getRequestHeaders = function(req) {
	// modern
	if (req.rawHeaders) {
		return rawHeadersToPairs(req.rawHeaders);
	}
	// old 0.10.X series
	return headersToPairs(req.headers);
};

var getPost = function(req, maxSize, bodyMethods) {
	// can this method even have a body?
	if (bodyMethods[req.method] !== true) {
		return false;
	}

	var contentLength = parseInt(req.headers['content-length']);

	// does content-length not exist or not make sense?
	if (isNaN(contentLength) || contentLength <= 0) {
		return false;
	}

	// too big?
	if (contentLength >= maxSize) {
		return false;
	}

	// something the agent can decode?
	// eslint-disable-next-line
	var contentType = ('' + req.headers['content-type']).toLowerCase();
	if (
		contentType.indexOf('application/x-www-form-urlencoded') === -1 &&
		!contentType.startsWith('multipart/form-data') &&
		contentType.indexOf('json') === -1 &&
		contentType.indexOf('javascript') === -1 &&
		contentType.indexOf('xml') === -1
	) {
		return false;
	}

	// yes, read in post body
	return true;
};

var isNotSpace = function(header) {
	return header !== '';
};

var splitHeader = function(line) {
	var keyVal = line.split(':');
	if (keyVal.length < 2) {
		return [keyVal[0].trim(), ''];
	} else {
		return [keyVal[0].trim(), keyVal.splice(1).join(':').trim()];
	}
};

var getResponseHeaders = function(res) {
	return res._header.split('\r\n').filter(isNotSpace).map(splitHeader);
};

function Sigsci(userOptions) {
	this.options = merge(defaultOptions, userOptions);

	// Determine if we are UDS or TCP
	//
	// The default is to use UDS, so 'path' is set, and 'port' is unset.
	//
	// For TCP:
	//   'port' must be specified
	//   'host' is optional and defaults to 'localhost'
	//
	// For UDS:
	//   'path' must be specified
	//
	// So:
	//   If 'port' is set after merge, then we are TCP, and
	//   delete the 'path' property to prevent node.js confusion.
	//
	// https://nodejs.org/api/net.html#net_socket_connect_options_connectlistener
	//
	if ('port' in this.options) {
		delete this.options.path;
	}
}

Sigsci.prototype.makePre = function(req, postBody) {
	var now = Date.now();
	var sock = req.socket;

	var scheme = 'http';
	var tlsProtocol = '';
	var tlsCipher = '';
	if (typeof sock.getCipher === 'function') {
		scheme = 'https';
		var cipherStuff = sock.getCipher();
		if (cipherStuff !== null) {
			tlsProtocol = cipherStuff.version;
			tlsCipher = cipherStuff.name;
		}
	}

	return {
		// TODO: make the next two static
		// eslint-disable-next-line
		ModuleVersion: 'sigsci-module-nodejs ' + module.version,
		// eslint-disable-next-line
		ServerVersion: 'nodejs ' + process.version,
		ServerFlavor: '',
		ServerName: req.headers.host, // TBD vs. require('os').hostname(); ? why include at all
		Timestamp: Math.floor(req._sigsciRequestStart / 1000),
		NowMillis: now,
		RemoteAddr: req.connection.remoteAddress,
		Method: req.method,
		Scheme: scheme,
		URI: req.url,
		Protocol: req.httpVersion,
		TLSProtocol: tlsProtocol,
		TLSCipher: tlsCipher,
		HeadersIn: getRequestHeaders(req),
		PostBody: postBody,
	};
};

Sigsci.prototype.middleware = function(req, res, next) {
	req._sigsciRequestStart = Date.now();
	req._sigsciBytesWritten = req.socket.bytesWritten;

	// skip methods we don't care about
	if (this.options.ignoreMethods[req.method] === true) {
		return next();
	}

	var self = this;
	var log = this.options.log;
	var client = new net.Socket();

	client.setTimeout(this.options.socketTimeout);

	client.connect(this.options, function() {
		req._sigsciSession = new Session();
		req._sigsciSession.attach(client, client);
		req._sigsciClient = client;
		req._sigsciNext = next;
		self.afterConnect(req, res);
	});

	client.on('error', function(err) {
		// eslint-disable-next-line
		log(util.format('PreRequest connection error ' + JSON.stringify(err)));
		client.destroy(); // kill client after server's response
		return next();
	});

	client.on('timeout', function(err) {
		// err is typically undefined here since its a timeout
		// need to touch it to prevent lint error
		err = null;
		log(
			util.format(
				'PreRequest timeout after %d ms',
				Date.now() - req._sigsciRequestStart
			)
		);
		client.destroy(); // kill client after server's response
		return next();
	});
};

// Express is for wrapping express()
Sigsci.prototype.express = function() {
	var self = this;
	return function(req, res, next) {
		self.middleware(req, res, next);
	};
};

// Wrap is for native API
Sigsci.prototype.wrap = function(next) {
	var self = this;
	return function(req, res) {
		self.middleware(req, res, function() {
			next(req, res);
		});
	};
};

Sigsci.prototype.afterConnect = function(req, res) {
	var self = this;
	res.on('finish', function() {
		self.onAfterResponse(req, res);
	});
	var callback = function(err, rpcResponse) {
		self.onPre(req, res, err, rpcResponse);
	};

	// GET or other method without body
	if (!getPost(req, this.options.maxPostSize, this.options.bodyMethods)) {
		req._sigsciSession.request(
			'RPC.PreRequest',
			[this.makePre(req, '')],
			callback
		);
		return;
	}

	// POST - async read
	var postBody = '';
	var fnOnData = function(chunk) {
		// append the current chunk of data to the fullBody variable
		postBody += chunk.toString();
	};
	var fnOnEnd = function() {
		// now we need to "push back" the postbody into a stream that
		// so the raw application can continue to function no matter
		// what

		// First remove the listeners we already set up
		req.removeListener('data', fnOnData);
		req.removeListener('end', fnOnEnd);

		// make new stream, copy it over into current request obj
		var s = new stream.Readable();
		s._read = function noop() {};
		for (var attr in s) {
			req[attr] = s[attr];
		}

		// push in new body and EOF marker
		req.push(postBody);
		req.push(null);

		// make a pre-request, and run callback aftewards
		req._sigsciSession.request(
			'RPC.PreRequest',
			[self.makePre(req, postBody)],
			callback
		);
	};

	req.on('data', fnOnData);
	req.on('end', fnOnEnd);
};

Sigsci.prototype.afterBody = function(req, res, postbody) {
	if (!getPost(req, this.options.maxPostSize, this.options.bodyMethods)) {
		return this.afterBody(req, res, postbody);
	}
};

Sigsci.prototype.onPre = function(req, res, err, rpcResponse) {
	req._sigsciClient.destroy();

	if (err) {
		// fail open.
		this.options.log(util.format('onPre error: %s', err));
		return req._sigsciNext();
	}

	// save agent response since we'll use it later.
	req.SigSciAgent = rpcResponse;

	var blocking = rpcResponse.WAFResponse;
	if (blocking === 406) {
		res.writeHead(406, { 'Content-Type': 'text/plain' });
		res.end('not acceptable');
		return;
	}
	req._sigsciNext();
};

Sigsci.prototype.send = function(req, res, method, obj, callback, onerror) {
	req._sigsciPostRequestStart = Date.now();
	var client = new net.Socket();
	var log = this.options.log;
	var debug = this.options.debug;

	var destroyCallback = function(err) {
		if (!client.destroyed) {
			client.destroy();
		}
		if (callback) {
			callback(err);
		}
	};

	client.setTimeout(this.options.socketTimeout);
	client.connect(this.options, function() {
		var session = new Session();
		session.attach(client, client);
		session.request(method, [obj], destroyCallback);
	});

	client.on('error', function(err) {
		log(util.format('Update/PostRequest connection error: %s', err.message));
		client.destroy(); // kill client after server's response
		if (onerror) {
			onerror(req, res);
		}
	});

	client.on('timeout', function(err) {
		var duration = Date.now() - req._sigsciPostRequestStart;
		if (debug) {
			var rpcResponse = req.SigSciAgent;
			var requestId = '';
			if (rpcResponse) {
				requestId = rpcResponse.RequestID;
			}
			log(
				util.format(
					'send,%s,%s,%s,%s',
					req._sigsciRequestStart,
					Date.now(),
					requestId,
					req._sigsciPostRequestStart
				)
			);
		}
		log(
			util.format('Update/PostRequest timeout after %d ms: err', duration, err)
		);
		client.destroy(); // kill client after server's response
	});
};

Sigsci.prototype.onAfterResponse = function(req, res) {
	var obj;
	var rpcResponse = req.SigSciAgent;
	if (!rpcResponse) {
		// something bad happened
		return;
	}

	var duration = Date.now() - req._sigsciRequestStart;
	if (duration < 0) {
		duration = 0;
	}

	var headers = getResponseHeaders(res);
	var contentLength = -1;
	for (var i = 0; i < headers.length; i++) {
		if (headers[i][0].toLowerCase() === 'content-length') {
			contentLength = parseInt(headers[i][1]);
		}
	}
	if (contentLength === -1 && req.socket.bytesWritten) {
		contentLength = req.socket.bytesWritten - req._sigsciBytesWritten;
	}
	if (this.options.debug) {
		this.options.log(
			util.format(
				'after,%s,%s,%s',
				req._sigsciRequestStart,
				Date.now(),
				rpcResponse.RequestID
			)
		);
	}

	if (rpcResponse.RequestID) {
		obj = {
			WAFResponse: rpcResponse.WAFResponse,
			RequestID: rpcResponse.RequestID,
			ResponseCode: res.statusCode,
			ResponseMillis: duration,
			ResponseSize: contentLength,
			HeadersOut: getResponseHeaders(res),
		};
		this.send(
			req,
			res,
			'RPC.UpdateRequest',
			obj,
			this.onUpdateResponse.bind(this),
			null
		);
		return;
	}
	// full post response
	if (
		res.statusCode >= 300 ||
		duration > this.options.anomalyDuration ||
		contentLength > this.options.anomalySize
	) {
		obj = this.makePre(req, '');
		obj.WAFResponse = rpcResponse.WAFResponse;
		obj.ResponseCode = res.statusCode;
		obj.ResponseMillis = duration;
		obj.ResponseSize = contentLength;
		obj.HeadersOut = getResponseHeaders(res);

		// do update or post request
		this.send(
			req,
			res,
			'RPC.PostRequest',
			obj,
			this.onPostResponse.bind(this),
			null
		);
	}

	//
	// no update or post request --> nothing to do
	//
};

// onUpdateResponse is triggered after a RPC.UpdateRequest
Sigsci.prototype.onUpdateResponse = function(err /* , rpcResponse */) {
	if (err !== null) {
		this.options.log(util.format('RPC.UpdateResponse error: %s', err));
	}
};

// onPostResponse is triggered after a RPC.PostRequest
Sigsci.prototype.onPostResponse = function(err /* , rpcResponse */) {
	if (err !== null) {
		this.options.log(util.format('RPC.PostResponse error: %s', err));
	}
};

// ------------------------------------
// HAPI.JS Support
// ------------------------------------

Sigsci.prototype.hapi = function() {
	var self = this;
	return function(request, h) {
		self.middlewareHapi(request, h);
		return h.continue;
	};
};

Sigsci.prototype.hapiEnding = function() {
	var self = this;
	return function(request) {
		self.onAfterResponse(request.raw.req, request.raw.res);
	};
};

Sigsci.prototype.middlewareHapi = function(request, h) {
	var req = request.raw.req;
	req._sigsciRequestStart = Date.now();
	req._sigsciBytesWritten = req.socket.bytesWritten;

	// skip methods we don't care about
	if (this.options.ignoreMethods[request.method.toUpperCase()] === true) {
		return h.continue;
	}

	var self = this;
	var client = new net.Socket();
	request._sigsciClient = client;

	client.setTimeout(this.options.socketTimeout);

	client.on('error', function(err) {
		self.options.log(
			util.format('PreRequestHapi connection error ' + JSON.stringify(err)) // eslint-disable-line
		);
		client.destroy(); // kill client after server's response
		return h.continue;
	});

	client.on('timeout', function(err) {
		// err is typically undefined here since its a timeout
		// need to touch it to prevent lint error
		err = null;
		self.options.log(
			util.format(
				'PreRequestHapi timeout after %d ms',
				Date.now() - req._sigsciRequestStart
			)
		);
		client.destroy(); // kill client after server's response
		return h.continue;
	});

	// Add a 'close' event handler for the client socket
	// client.on('close', function() {
	//     console.log('PreRequestHapi: Connection closed');
	// });

	client.connect(this.options, function() {
		request._sigsciSession = new Session();
		request._sigsciSession.attach(client, client);
		self.afterConnectHapi(request, h);
	});
};

Sigsci.prototype.afterConnectHapi = function(request, reply) {
	var self = this;
	var callback = function(err, rpcResponse) {
		self.onPreHapi(request, reply, err, rpcResponse);
	};

	// GET or other method without body
	if (
		!getPost(
			request.raw.req,
			this.options.maxPostSize,
			this.options.bodyMethods
		)
	) {
		request._sigsciSession.request(
			'RPC.PreRequest',
			[this.makePre(request.raw.req, '')],
			callback
		);
		return;
	}

	// POST - async read
	var postBody = '';
	var fnOnData = function(chunk) {
		// append the current chunk of data to the fullBody variable
		postBody += chunk.toString();
	};
	var fnOnEnd = function() {
		// now we need to "push back" the postbody into a stream that
		// so the raw application can continue to function no matter
		// what

		// First remove the listeners we already set up
		request.raw.req.removeListener('data', fnOnData);
		request.raw.req.removeListener('end', fnOnEnd);

		// make new stream, copy it over into current request obj
		var s = new stream.Readable();
		s._read = function noop() {};
		for (var attr in s) {
			request.raw.req[attr] = s[attr];
		}

		// push in new body and EOF marker
		request.raw.req.push(postBody);
		request.raw.req.push(null);

		// make a pre-request, and run callback aftewards
		request._sigsciSession.request(
			'RPC.PreRequest',
			[self.makePre(request.raw.req, postBody)],
			callback
		);
	};

	request.raw.req.on('data', fnOnData);
	request.raw.req.on('end', fnOnEnd);
};

Sigsci.prototype.onPreHapi = function(request, reply, err, rpcResponse) {
	request._sigsciClient.destroy();

	if (err) {
		// fail open.
		this.options.log(util.format('onPre error: %s', err));
		return reply.continue();
	}

	// save agent response since we'll use it later.
	request.raw.req.SigSciAgent = rpcResponse;

	var blocking = rpcResponse.WAFResponse;
	if (blocking === 406) {
		return reply(406).code(406);
	}
	return reply.continue();
};

module.version = '1.4.7';

module.exports = Sigsci;
