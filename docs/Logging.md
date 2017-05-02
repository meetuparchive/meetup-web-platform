# Logging

We use [Pino](https://github.com/pinojs/pino) for server-side logging in the
platform, which provides nicely formatted logs in development and JSON-encoded
logs for production.

## Usage

**Do not use in browser-loaded modules** - use `console.log/warn/error` instead.

Basic usage is described in the [Pino usage
docs](https://github.com/pinojs/pino#usage), but the tl;dr is that the basic
[Log4j log levels](https://en.wikipedia.org/wiki/Log4j#Log4j_log_levels) are all
supported with corresponding `logger[level]` methods.

In general, server code should prefer to access the logger through the Hapi
server instance at `server.app.logger`.

```js
// Direct `server` access
function myModule(server) {
  server.app.logger.info('Hello module');
}

// Access through `request.server`
function requestHandler(request) {
  request.server.app.logger.info('Hello request handler');
}

// Access through `response.request.server`
function responseHandler(response) {
  response.request.server.app.logger.info('Hello response handler');
}
```

If a module does _not_ have access to the `server` instance, the logging
instance can also be imported directly at the cost of function purity and
slightly more complex unit testing configuration to mock the logger module.

```js
import logger from '../util/logger';

function doStuff() {
  logger.info('Hello stuff');
}
```

