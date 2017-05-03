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
  component: React$Element<any>,
  path?: string,
  indexRoute?: PlatformRoute,
  getIndexRoute?: () => Promise<PlatformRoute>,
  routes?: () => Promise<Array<PlatformRoute>>,
  getNestedRoutes: 
  query?: QueryFunction,
  exact?: boolean,
};
```

Route arrays will be rendered _exclusively_, in order, so overlapping routes
should put the most specific route at the top of the `routes` array. Within app
components, you may use the full range of features provided by the [React Router
v4 API](https://reacttraining.com/react-router/api). However, be aware that any
navigation-based data fetching must be defined in this top-level `routes`
configuration object passed to the app renderers.

### `component`

The React component that will be rendered when the route matches.

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

### `indexRoute` (synchronous)

The `indexRoute` parameter is a pared-down `PlatformRoute` definition that
contains just the `component` that should be rendered when the location/url
matches the root `path` _exactly_.

### `getIndexRoute` (asynchronous)

A function that, when invoked, will return a Promise that resolves with a
`Route` object. This can be used for code splitting by using `import()` to
dynamically import a route to be used as the `exact` index root.

### `routes`

An array of 'child routes' that will be rendered as children of any parent
routes. Child routes' `path` property will be concatenated with the parent
`route`.

### `getNestedRoutes` (asynchronous)

A function that, when invoked, will return a Promise that resolves with a
`routes` array. This can be used for code splitting by using `import()` to
dynamically import a route subtree

```js
{
  path: '/',
  component: RootContainer,
  getNestedRoutes: () => import('./childRoutes').then(r => r.default),
}
```


### 404 Not Found route

It's generally a good idea to include a catch-all, no-path route that provides
the 404 page for any invalid child route. It will still be rendered as a child
of the root route, so it can contain the data/context of that route. For
example, the 404 route at the group `/:urlname` level could include Group
information and links back to the group homepage or event list.

