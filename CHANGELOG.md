## [1.0]

- **Require Node v7** for require('url').URL
- **Require window.URL** polyfill for browsers without native support

## [0.11]

- **Removed** `apiConfigCreators` no longer exists - use the query object
directly to define the `endpoint`

## [0.10]

- **New env variable** - `COOKIE_ENCRYPT_SECRET` must be in your env vars. It
must be a 32+ character random string.
- **Refactored** - auth cookies are now encrypted, so existing cookies must be
cleared in the browser.

## [0.9]

- **Removed** - Many of the shared methods in `src/util/testUtils`
now are in the `meetup-web-mocks` repo
- **Change** - Use the `meetup-web-mocks` repo for testUtil methods,
e.g.,

```js
import {
  createFakeStore,
} from 'meetup-web-mocks/lib/testUtils';
```

## [0.8]

- **Change** - `API_SUCCESS` now returns a `meta` prop that contains the `csrf`
token returned by the server that will be used to validate all POSTs. Your
Redux reducer must include a `config` reducer that will assign `config.csrf`
on `API_SUCCESS`, e.g.

```js
function config(state={}, action) {
	let csrf;
	switch(action.type) {
	case 'API_SUCCESS':
		csrf = action.meta.csrf;
		return { ...state, csrf };
	//...
  }
}
```

## [0.7]

- **Removed/Refactor** - there are no more `LOGOUT_X` actions. Logout is instead
a navigation action to any URL with `?logout` in the URL.

## [0.6]

- **Removed** - `CONFIGURE_AUTH` action will no longer contain a key named
`anonymous`. The app can determine whether the current user is logged in from
the `app.self` value, which should be a memeber object with a `status`
indicating whether the user is logged in.
- **Deprecated** - the `ANONYMOUS_ACCESS_URL` and `ANONYMOUS_AUTH_URL` env
variable names have been changed to `OAUTH_ACCESS_URL` and `OAUTH_AUTH_URL`,
respectively. The only names will still be read, but will be removed entirely
in a future version.

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
