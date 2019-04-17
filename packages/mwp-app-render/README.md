# Render

This package contains modules directly related to rendering an MWP React+Redux
application.

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
	ReactDOM.render(<BrowserApp {...props} />, document.getElementById('outlet'))
);
```

Notes:

1. Consumer apps _must_ render the application at the element with an `id` of
   `'outlet'` - this div is provided by the platform server renderer.
2. If you need direct access to the `store`, it can be read from `props.store`
   in the resolved value from `resolveAppProps`.

# Server config values - AppContext

The server has access to the original browser HTTP request and passes information
about it into the React application through the `AppContext` React Context provider.

The available properties are documented in the
[`type AppContext`](https://github.com/meetup/meetup-web-platform/blob/master/flow-typed/platform.js#L10)

To access these properties, import the `AppContext` component and use the [React
Context Consumer API](https://reactjs.org/docs/context.html#contextconsumer)
to expose the `appContext` object to child components.

Example:

```jsx
import { AppContext } from 'mwp-app-render/lib/components/shared/PlatformApp';

const MyComponent = props => (
	<AppContext.Consumer>
		{appContext => <p>My language is {appContext.requestLanguage}</p>}
	</AppContext.Consumer>
);
```

## Components

The React components in `components/` are application-general wrappers of app-
specific UIs that provide the necessary React component lifecycle behavior to
enable navigation-related data fetching, and shared document structure like
`<head>` content and the icon SVG sprite.

-   The app wrapper components: `<BrowserApp>` and `<ServerApp>`

    These components provide the top-level entry point for the React application
    tree. They should be used with `ReactDOM.render` and
    `ReactDOMServer.renderToString`, respectively

-   `<PageWrap>`

    The top-level _rendering_ component for the React application - this should
    generally be used at root-level route in the passed in routes. _This could be
    phased out as a public component, and instead built into `<BrowserApp>` and
    `<ServerApp>`_

    The code for `PageWrap` is organized in a directory as a standalone 'package'
    because the relevant code is organized into a few separate 'internal' modules.

-   `<Dom>`

    A React component used on the server to get a full `<html>` document string
    from `ReactDOMServer.renderToString()`. The actual application markup must
    be supplied as a raw HTML string in the `appMarkup` prop.
