## [16.1]

- **NEW FEATURE** the prod REST API can now be used directly in the dev environment.
  To enable, simply add `{ "api": { "host": "api.meetup.com" } }` to a
  `config.development.json` file in the root of your application. _Note_: there
  is no visible difference between using the prod REST API and the dev REST API.
  Try not to chnage any data that doesn't belong to you.

## [16.0]
- **BREAKING CHANGE** webpack build configurations have been moved to
   mwp-cli and are no longer a part of `mwp-config`. Make sure to upgrade
   to mwp-cli >= 7.1.429.

## [15.1]
- **NEW FEATURE** `api.track` action creator for async activity tracking requests
  from consumer apps. Pass along `viewName` and (optionally) `subViewName` in
  `query.params` in order to tag the record with those fields.

## [15.0]
- **BREAKING CHANGE** routing definitions no longer support `getIndexRoute` and
  `getNestedRoutes`. Instead, async loading should happen at the component level
  - use `getComponent` instead of `component`.

## [14.1]

- **NEW FEATURE** support for `query.list` param to aggregate list endpoint
  responses

## [14.0]

- **BREAKING CHANGE** dropping support for React 15. Peer dependencies
  will require React 16.3 or higher.
- Upgrade meetup-web-component dependencies to latest (4.8.2111), and
  require meetup-web-component@^4.8.0 for peer dependencies.

## [13.1]

- **New feature** `state.flags` containing all LaunchDarkly feature flags

## [13.0]

- **BREAKING CHANGE** `publicPath` now set as a config var that is shared by server
  and browser build config - `APP_RUNTIME.assetPublicPath` is no longer populated
  by server, and consumer apps no longer need to set a 'dynamic' `__webpack_public_path__`
  value in either the server or browser entry point script
- `asssetPublicPath` no longer needs to be passed to `server-render/makeRenderer`

# [12.4]

* **Bugfix** the Redux cache middleware will now key the cache with the logged-in
  member's ID in order to avoid incorrectly returning cached results corresponding
  to other members or logged-out responses.


## [12.3]

- **New feature** `SEOHead` a component for rendering SEO content in the document
  head. Also adds related utils under `src/util/seo`. [WP-532](https://meetup.atlassian.net/browse/WP-532)

## [12.2]

- **Simplified** `makeServerRenderer$` no longer requires a `baseUrl` param - it
  will be determined from the request directly

## [12.1]

- **Refactor** `mwp-i18n/lib/withIntl` now expects a map of
  `{ [localeCode]: messages }` in its `messages` arg. `mwp-cli` has been updated
  to provide this TRN source structure automatically.

## [12.0]

- **Moved** `mwp-core/lib/localizationUtils` is now part of `mwp-i18n`, renamed
  to `loadLocaleData`
- **New package** `mwp-i18n`, which currently contains the `withIntl` HOC and
  `loadLocaleData`

## [11.1]

- **New package** `mwp-config` - a dedicated 'config' package that can be freely
  imported to other MWP packages and consumers.

## [11.0]

- **Removed** `api.requestAll` action creator is now a private function.
  Consumers _must_ use the method-specific API request action creators, which
  now accept arrays of queries in addition to single query
- **Removed** The `meta.promise` property of API actions has been removed - use
  the `meta.request` Promise instead, which will return an array of responses.
  E.g. instead of `api.post(...).meta.promise.then(response => ...)`, use
  `api.post(...).meta.request.then(([response]) => ...)`
- **Removed** `api.requestAll` is no longer exported - use the method-specific
  action creators with the following enhancement:
- **New feature** `api.get/post/patch/del` can now be called with an array of
  queries in order to make a batched API request

## [10.2]

- **Removed** Oauth authentication for no-cookie requests. This means we no
  longer need `MUPWEB_OAUTH_TOKEN` and `MUPWEB_OAUTH_SECRET` env vars. Consumer
  applications should not need to change any of their code, but deployments
  can be cleaned up

## [10.1]

- `mwp-api-state` refactored to remove redux-observable + rxjs dependencies -
  those are no longer peerDependencies. `redux-observable` is not currently used
  by any other MWP package and can be removed from consumer apps

## [10.0]

- Removed polyfill for `Intl.NumberFormat` and `Intl.DateTimeFormat` - consumers
  should instead use the `full-icu` package and follow its instructions to
  ensure that Node will load all required locale data when it starts.

## [9.1]

- Support for reading `MEETUP_VARIANT_...` cookies into `state.config.variants`

## [9.0]

### BREAKING CHANGES

- **Removed** Queries specifying REST API endpoints that do not support
  logged-out members will no longer produce responses. Specifically,
  `members/self` will not be called, meaning that `state.api.self` can not be
  assumed to have a value throughout the application - a selector function
  should be used to provide a reasonable default value in your components.

## [8.1]

- `mwp-log` now contains nicely-formatted logs

## [8.0]

- **All 'internal' packages now published independently**:
   - `mwp-api-proxy-plugin`
   - `mwp-api-state`
   - `mwp-app-render`
   - `mwp-app-route-plugin`
   - `mwp-app-server`
   - `mwp-auth-plugin`
   - `mwp-core`
   - `mwp-language-plugin`
   - `mwp-router`
   - `mwp-store`
   - `mwp-sw-plugin`
   - `mwp-tracking-plugin`
   - `mwp-test-utils`

## [7.1]

- **Feature**: Pass in an array of string `cssLinks` to `makeServerRenderer$` in
  order to add static CSS `<link>` tags to the document `<head>`. These tags
  will not be affected by `<link>`s defined within `<Helmet>` tags of the
  application, and therefore will not be subject to being clobbered by
  client-side rendering that will cause a FOUC (as described in
  [this react-helmet issue](https://github.com/nfl/react-helmet/issues/98)).

  **Important**: The consumer application must ensure that the CSS _files_ are
  bundled with the browser application script as well, even though the links
  themselves are not required by the browser app renderer.

## [7.0]

### BREAKING CHANGES

- **Moved** `src/server` is now `src/app-server`

## [6.0]

### BREAKING CHANGES

- **Moved** `src/components/Redirect` --> `require('src/router').Redirect`
- **Moved** `src/components/Forbidden` --> `require('src/router').Forbidden`
- **Moved** `src/actions/apiActionCreators`: The action `type` constants and
  action creators are exported from `require('src/api-state')`:

  - `API_REQ`
	- `API_RESP_SUCCESS`
	- `API_RESP_COMPLETE`
	- `API_RESP_ERROR`
	- `API_RESP_FAIL`
	- `requestAll`
	- `get`
	- `post`
	- `patch`
	- `del`

- **Moved** `src/actions/syncActionCreators`: The action `type` constants and
  location change action creators are exported from `require('src/router')`.
  Deprecated `apiError`, `apiSuccess`, `apiRequest` action creators can be
  imported directly from `src/api-state/sync/syncActionCreators`, but should be
  marked as 'deprecated' and converted to the `api-state` action creators above.

  - `SERVER_RENDER`
  - `LOCATION_CHANGE`
  - `locationChange`

- **Moved + renamed** `src/middleware/platform:getEpicMiddleware` has moved to
  `require('src/api-state').getApiMiddleware`

- **Moved + renamed** Parts of `src/reducers/platform` have moved to
  `src/store/reducer`. `makeRootReducer` is now the default export of the
  module. The `api` and `app` (deprecated) reducers are now in `src/api-state`,
  along with `DEFAULT_API_STATE`.

- **Moved** some `src/components` moved to `src/render/components`:

  - `PlatformApp` - should not be used - choose `BrowserApp` or `ServerApp`
  - `PageWrap`
  - `BrowserApp`
  - `ServerApp`

- **Moved** `state.config.localeCode` is now `state.config.requestLanguage` to
  better describe where the locale code comes from - make sure you update to the
  latest meetup-web-mocks in order to get a valid `MOCK_APP_STATE`

## [5.1]

- **Change** (could be considered breaking, but it's specifically for a
  requested update to GroupCard in mup-web): `group.duotoneUrl` is now an object
  with `small` and `large` properties - `small` has a resolution of 300x400, and
  `large` has a resolution of 1100x800.

## [5.0]

### BREAKING CHANGE

- **Fixed** the `platform_agent` in tracking logs is now determined from
  `package.json`, which should have a `config.agent` string of `MUP_WEB` or
  `PRO_WEB`.

## [4.0]

### BREAKING CHANGES

- **Removed** Support for `?logout` query parameter, and platform-based
  Login/Logout components. Platform consumers should use the `<Redirect>`
  component to redirect login and logout requests to Meetup classic until
  login and logout can be handled fully by the platform in a future update.

## [3.3]

- **New feature** API request actions now contain a reference to a Promise that
  will resolve when the API request returns. [WP-334](https://meetup.atlassian.net/browse/WP-334)
- **New feature** Supply `initialNow` to `state.config` to sync server and
  browser time reference.
- **New feature** 301/302 Redirects now supported for internal and external
  routes. [WP-331](https://meetup.atlassian.net/browse/WP-331)
- **New feature** Query creator functions assigned to routes will now receive
  all React Router `match` properties in their argument. [WP-352](https://meetup.atlassian.net/browse/WP-352)

## [3.2]

- **Deprecated** `~/.mupweb.config` has been deprecated - node convict now
  manages environment configurations in `util/src/config.js`. To override any
  of the default values in development, create a `config.development.json` file
  with the name of the configuration and new value. This file is automatically
  gitignored. See `config.test.json` for an example configuration.

# [3.1]

- **New feature** Google App Engine PubSub tracking logs. To enable, consumer
  apps must ensure that the `GAE_INSTANCE` environment variable is set in the
  app container - GAE provides it automatically to the GAE runtime. Docs:
  https://cloud.google.com/appengine/docs/flexible/nodejs/runtime#environment_variables

## [3.0]
- **Refactor** default locale is determined by first locale in list,
  as specified in consuming repo's /src/util/locales.js

## [2.5]

- **New feature** support for asyncronous routes (PR #266).
  [Docs](docs/Routing.md#load-asynchronous). Note the new `resolveAppProps`
  helper that allows the browser script to delay rendering until async routes
  are resolved - [rendering docs here](docs/Rendering#browser-rendering).

## [2.4]

- **Deprecated** `renderers/browser-render.jsx` has been deprecated - consumer
  applications should use vanilla React render methods to render a `<BrowserApp
  />`, which is the new entry point for a platform-based applications, at
  `src/components/BrowserApp.jsx`. The browser entry point should contain the
  following code:

    ```jsx
    import ReactDOM from 'react-dom';
    import {
      getInitialState,
      getBrowserCreateStore
    } from '../util/createStoreBrowser';

    const routes = ...;
    const reducer = ...;
    const middleware = ... || [];
    const basename = ... || '';

    const createStore = getBrowserCreateStore(routes, middleware, basename);
    const store = createStore(reducer, getInitialState(window.APP_RUNTIME));
    ReactDOM.render(
      <BrowserApp routes={routes} store={store} basename={basename} />,
      document.getElementById('outlet')  // this is a hard-coded id
    );
    ```

## [2.3]

- **Replaced** `state.api.isFetching` has been replaced with
  `state.api.inFlight`, which is an array of `ref`s corresponding to query
  requests that have not yet returned. Use `state.api.inFlight.includes(fooRef)`
  to determine whether a particular query has returned.

## [2.2]

- **Deprecated** all of the Sync action creators (e.g. `syncActionCreators.apiRequest`)
  have been deprecated. You should instead use the new `apiActionCreators` to
  manually trigger API requests - see the [Queries docs](./docs/Queries.md#usage)
  for more info. The Sync action creators will be removed in version 3.

  There are four things that consumer apps need to update:

  1. `syncActionCreators.apiRequest` query dispatches must be converted to
     `apiActionCreators.requestAll` (or the method-specific equivalents
     [described in the Queries
     docs](https://github.com/meetup/meetup-web-platform/blob/30a220c9a5cb3b9339c4fbccd6e9ff1efbf5a49a/docs/Queries.md#action-creation)).

  2. All reads from `state.app` should be converted to `state.api` - the child
     properties will be the same `ref`s used in `state.app`, except for
     `state.app.error` which is now `state.api.fail`.

  3. Any reducers listening for `API_SUCCESS` (which has a `payload` containing
     an object with a `queries` array and corresponding `responses` array) must
     be refactored to listen for `API_RESP_SUCCESS` and `API_RESP_ERROR`
     actions, which will each contain a `{ query, response }` object
     corresponding to a single query and its response.

     The shape of each `response` object has also changed - instead of a single
     root-level key corresponding to the original query's `ref`, the response
     is now a flat object with a `ref` property.

     Instead of parsing the `API_SUCCESS` payload for errors, reducers will now
     be able to specifically identify responses that correspond to
     failed/invalid responses from the REST API by listening for
     `API_RESP_ERROR` - `API_RESP_SUCCESS` will always correspond to a valid
     REST API response.

  4. Any reducers listening for `API_ERROR` must be refactored to listen for
     `API_RESP_FAIL`. Both actions have the same `Error` object payload
     corresponding to a general API request failure, unrelated to a specific
     query.

  These changes must by made simultaneously, and this list assumes that the
  refactor described in the `v2.1` changelog has been completed first.

## [2.1]

- **Deprecated** POSTing and DELETEing through custom `POST_...` or `DELETE_...`
  actions has been deprecated - a warning will be printed in the server logs.
  Use the `meta.method` field in your Query objects to determine the request
  method, and use `componentWillReceiveProps` to process the API result [as
  described in the
  docs](https://github.com/meetup/meetup-web-platform/blob/master/docs/Queries.md#recipes)

## [2.0]

- **Refactor** Upgrade to React Router v4. Routes definitions change - the root
  level routes definition is now an array, and each route must have the following
  shape:

  ```ts
  {
    path: string,  // must have leading '/', except for the root '' path
    component: React.Component,
    query?: function,
    routes?: array,  // child routes, with `path` props that append to the parent
    exact?: boolean,  // forces the component to only render when url is exact
      match
  }
  ```

  Note that async routes are no longer supported - they will return in a new form
  in a future update

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
