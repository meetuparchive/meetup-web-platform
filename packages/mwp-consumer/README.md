Mock MWP consumer app for platform testing

# Setup

1. Go to the `meetup-web-platform` repo root and run `yarn install`. You
   may need to first install lerna if you haven't already
   `npm install --global lerna`
2. Go to the `meetup-web-platform/packages/mwp-consumer/` directory and run
   `lerna run build && yarn start | grep "GC HAPPENED"`
3. In a new terminal window, run Apache Bench with a valid member cookie env
   variable, e.g.

   ```
   $ COOKIE='MEETUP_MEMBER_DEV="id=..."'
   $ ab -H Cookie:$COOKIE -l -c 10 -n 3000 https://beta2.dev.meetup.com:8000/
   ```

4. Watch the server logs - you should see periodic "GC HAPPENED" output, and
   eventually something that looks like

    ```
    GC HAPPENED Memory leak detected:
    { growth: 8509368,
     reason: 'heap growth over 5 consecutive GCs (33s) - 885.29 mb/hr' }
    ```

5. **Important** If you are making changes to files, you must _re-build_ and
   _restart_ the dev server with `lerna run build && yarn start | grep "GC HAPPENED"`

# Performance monitoring strategies

## The early-return

Requests to the app-rendering endpoint primarily go through the following
modules:

0. `mwp-app-server/src/util/index.js` - Starting and configuring the Node server
1. `mwp-app-route-plugin/src/handler.js` - Node route handler
2. `mwp-core/src/renderers/server-render.jsx` - Application setup, including Redux store
3. `mwp-app-render/src/components/ServerApp.jsx` - React app mounting

There are many other modules involved, but these are the best-defined entry
points for testing how the server behaves when each function returns early, i.e.
checking the performance impact of skipping some rendering steps.

- For the most part, every part of the server startup routine is required.
- The route handler just needs to `return '<SOME RESPONSE STRING>'` - adding
  that and a `return` before the renderer is called will show the the theoretical
  performance of a fully-configured server that executes _no_ rendering logic
- The main rendering function in `server-render.jsx` is `makeRenderer`, which
  returns a function that is called with each incoming request object and
  returns an Observable that emits a `{ statusCode: int, result: string }`
  object. You can return the following to short-circuit the function at any
  point:

  ```js
  return Observable.of({ statusCode: 200, result: 'whatever' });
  ```

- `ServerApp` is just the top-level React component wrapper for the consumer
  app that is defined statically `routes` object. You can return plain HTML
  JSX elements anywhere in the app tree to determine the performance impact
  of particular branches of the application tree.

## The plugin switcheroo

Testing the effect of particular plugins on server performance is a bit trickier
because they have cross dependencies. For example, `mwp-app-route-plugin`
depends on `mwp-logger-plugin`, so in order to test the server _without_
`mwp-logger-plugin`, `mwp-app-route-plugin` has to be refactored to use something
else, or `mwp-logger-plugin` must be refactored to supply the same API through
dummy functions, e.g. `{ log() {}, error() {}, warn() {} }`. The latter approach
is preferable because you won't have to refactor _all_ dependent packages.

Over time, we hope to update all plugins to have fewer cross dependencies - e.g.
by making `mwp-logger-plugin` optional using a fallback interface that is
internally defined within each plugin that uses it. This is a long-term goal and
is unlikely to be done until well into 2018.

