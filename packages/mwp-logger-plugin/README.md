# Logging

We use [Bunyan](https://github.com/trentm/node-bunyan) for server-side logging
in the platform, which provides JSON-encoded logs for production and a pretty-
printing CLI for dev.

## Usage

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
import logger from 'mwp-logger-plugin/lib/logger';

function doStuff() {
  logger.info('Hello stuff');
}
```
