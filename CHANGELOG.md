## [0.6]

- **Removed** - `CONFIGURE_AUTH` action will no longer contain a key named
`anonymous`. The app can determine whether the current user is logged in from
the `app.self` value, which should be a memeber object with a `status`
indicating whether the user is logged in.

## [0.5]

- **Refactor** - all modules are now transpiled to CommonJS ES5 modules in
`lib/`, so your import paths should change:

```js
// v0.4
import <module> from 'meetup-web-platform/<moduleName>';

// v0.5
import <module> from 'meetup-web-platform/lib/<moduleName>';
```

If you want to use the ES6 source files directly, import them with
`'meetup-web-platform/src/<moduleName>';`

## [0.4]

- **Renamed** - `getEpicMiddleware` is now `getPlatformMiddleware` since all
platform middleware functionality is provided as a single redux-observable
epic-based middleware combining multiple epics
- **Removed** `PostMiddleware` - the equivalent functionality is now provided
as an epic in `PostEpic`, which is part of `getPlatformMiddleware`

## [0.3]

- **Added** `getEpicMiddleware`
- **Removed/Added** `SyncMiddleware`, `CacheMiddleware`, `AuthMiddleware` are now
part of [`EpicMiddleware`](middleware/epic.js)
	- `getEpicMiddleware(routes)` will add functionality equivalent to the
	previous middleware. If you are using `createStore` from the platform library,
	you can ignore this update, as the middleware loading is done for you.

## [v0.2]

- **Refactor** [`server-render:makeRenderer`](renderers/server-render.jsx#L123)
now takes `clientFilename` and `assetPublicPath` as separate arguments
`clientFilename` is typically provided by the webpack build stats of the
client build process. `assetPublicPath` is usually constructed from env vars
in your server entry point.
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
