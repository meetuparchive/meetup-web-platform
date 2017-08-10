# Render

This package contains modules directly related to rendering an MWP React+Redux
application.

## Components

The React components in `components/` are application-general wrappers of app-
specific UIs that provide the necessary React component lifecycle behavior to
enable navigation-related data fetching, and shared document structure like
`<head>` content and the icon SVG sprite.

- The app wrapper components: `<BrowserApp>` and `<ServerApp>`

  These components provide the top-level entry point for the React application
  tree. They should be used with `ReactDOM.render` and
  `ReactDOMServer.renderToString`, respectively

- `<PageWrap>`
  
  The top-level _rendering_ component for the React application - this should
  generally be used at root-level route in the passed in routes. _This could be
  phased out as a public component, and instead built into `<BrowserApp>` and
  `<ServerApp>`_

- `<Dom>`

  A React component used on the server to get a full `<html>` document string
  from `ReactDOMServer.renderToString()`. The actual application markup must
  be supplied as a raw HTML string in the `appMarkup` prop.