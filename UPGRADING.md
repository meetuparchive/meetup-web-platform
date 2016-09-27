## [v0.2.x] to [0.3.0]

- **Removed** `SyncMiddleware` is now part of [`EpicMiddleware`](middleware/epic.js),
which exports a `getEpicMiddleware(routes)` function that replaces
`getSyncMiddleware(routes)`. This is a drop-in replacement. Future point-releases
will incorporate the remaining platform middleware.

## [v0.1.2] to [v0.2.0]

- **Refactor** [`server-render:makeRenderer`](renderers/server-render.jsx#L123)
now takes `clientFilename` and `assetPublicPath` as separate arguments rather
than the single combined string arg used previously. `clientFilename`
is typically provided by the webpack build stats of the client build process.
`assetPublicPath` is usually constructed from env vars in your server entry
point.
- In order to correctly apply the `assetPublicPath` to your server and client
builds, you must set `__webpack_public_path__` _before_ importing your
application code, e.g.
  
	```js
	// your client entry point
	__webpack_public_path__ = window.APP_RUNTIME.assetPublicPath;
	const routes = require('./routes').default;
	const reducer = require('./features/shared/reducer').default;
	const render = makeRenderer(routes, reducer);

	// your server entry point
	const clientFilename = WEBPACK_CLIENT_FILENAME;
	const assetPublicPath = ${process.env.ASSET_SERVER_HOST}:${process.env.ASSET_SERVER_PORT}/`;
	__webpack_public_path__ = assetPublicPath;  // eslint-disable-line no-undef
	const routes = require('./routes').default;
	const reducer = require('./features/shared/reducer').default;
	const renderRequest$ = makeRenderer(routes, reducer, clientFilename, assetPublicPath);
	```
