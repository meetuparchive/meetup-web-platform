# Rendering

Although the Meetup Web Platform is built on the principle of Universal
Javascript with a shared app codebase used for server and browser rendering,
consumer applications will still need to bundle the browser app and the server
app separately. The browser application will be instantiated in an entry point
script that calls `ReactDOM.render()`, while the server application will be
called from a route handler on the server.

## Browser rendering

The root application component in the browser is `BrowserApp`.

```jsx
<BrowserApp routes={routes} store={store} basename={basename} />
```

Although consumer applications can supply the `props` directly, the platform
provides a helper function, `resolveAppProps` that should typically be used to
correctly instantiate the `store`, resolve the `basename` from the app data
provided by the server, and populate any asynchronous route components.

### Example

The browser entry script would typically have the following structure:

```jsx
import { resolveAppProps } from 'meetup-web-platform/lib/renderers/browser-render';
import makeRootReducer from 'meetup-web-platform/lib/store/reducer';

const appReducers = require('./reducers'); // map of reducer keys to reducer functions
const reducer = makeRootReducer(appReducers); // create the root reducer function

resolveAppProps(routes, reducer, middleware).then(props =>
  ReactDOM.render(
    <BrowserApp {...props} />,
    document.getElementById('outlet')
  )
);
```

Notes:

1. Consumer apps _must_ render the application at the element with an `id` of
   `'outlet'` - this div is provided by the platform server renderer.
2. If you need direct access to the `store`, it can be read from `props.store`
   in the resolved value from `resolveAppProps`.

