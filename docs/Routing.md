# Routing

Platform apps use [React Router v4](https://reacttraining.com/react-router/) to
render application routes.

Currently, application routes must be provided in a static `routes`
configuration option, which allows the application to determine the API data
requirements of a route before it starts building the React virtual DOM on the
server.

## Route definition

Consumer apps are defined by their base routes + base reducer. The base routes
connect URLs to data fetch requirements and the corresponding React container
components.

Inside the platform `renderers/`, the `routes` array is mapped onto a full React
component tree, using `route` definitions that conform to the following shape:

```js
type PlatformRoute = {
  path: string,
  component: React.PropTypes.element,
  query?: (renderProps: Object) => Query,
  routes?: Array<PlatformRoute>,
}
```

Route arrays will be rendered _exclusively_, in order, so overlapping routes
should put the most specific route at the top of the `routes` array. Within app
components, you may use the full range of features provided by the [React Router
v4 API](https://reacttraining.com/react-router/api). However, be aware that any
navigation-based data fetching must be defined in this top-level `routes`
configuration object passed to the app renderers.

## Known limitations

1. No async routing - all routes and their components must be provided
   statically in the base `routes` array. Async loading of route components will
   likely be added in a future update.

