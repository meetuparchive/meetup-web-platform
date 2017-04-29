# Routing

Platform apps use [React Router v4](https://reacttraining.com/react-router/) to
render application routes.

Application routes must be provided in a static `routes` configuration option,
which allows the application to determine the API data requirements of a route
before it starts building the React virtual DOM on the server.

Async routes that allow code splitting are supported.

## Route definition

Consumer apps are defined by their base routes + base reducer. The base routes
connect URLs to data fetch requirements and the corresponding React container
components.

Inside the platform `renderers/`, the `routes` array is mapped onto a full React
component tree, using `route` definitions that conform to the [type defined in
`flow-typed/platform.js`](./flow-typed/platform.js).

```js
type PlatformRoute = {
	component?: React$Element<any>,
  load?: Promise<React$Element<any>,
	path?: string,
	exact?: boolean,
	query?: QueryFunction,
	indexRoute?: PlatformRoute,
	routes?: Array<PlatformRoute>,
};
```

_Note: either `load` **or** `component` must be defined_

Route arrays will be rendered _exclusively_, in order, so overlapping routes
should put the most specific route at the top of the `routes` array. Within app
components, you may use the full range of features provided by the [React Router
v4 API](https://reacttraining.com/react-router/api). However, be aware that any
navigation-based data fetching must be defined in this top-level `routes`
configuration object passed to the app renderers.

### `component` (synchronous)

The React component that will be rendered when the route matches.

### `load` (asynchronous)

If you want the route component (and all its unique dependencies) to load
asynchronously, specify a `load` function that returns a promise that will
resolve with the component instance.

```js
const myAsyncRoute = {
  path: '/foo',
  load: () => import('./FooContainer').then(c => c.default), // ES6 modules will return the element at `.default`
}
```

### `path`

The `path` for a route is defined _relative_ to whatever route it is nested
in. It should always start with a slash `/`. It should _never_ end with a slash.

**Note**: The standard implementation of React Router v4 does not directly
support relative `path` strings - we use the route configuration as a base for
calculating the full path that is passed to the underlying rendered `<Route>`
components.

### `exact`

Only render the current route when the URL matches exactly

### `query`

This is a function that yeilds a [`Query` object](./Queries.md).

### Index Route

The `indexRoute` parameter is a pared-down `PlatformRoute` definition that
contains just the `component` that should be rendered when the location/url
matches the root `path` _exactly_.

### 404 Not Found route

It's generally a good idea to include a catch-all, no-path route that provides
the 404 page for any invalid child route. It will still be rendered as a child
of the root route, so it can contain the data/context of that route. For
example, the 404 route at the group `/:urlname` level could include Group
information and links back to the group homepage or event list.

