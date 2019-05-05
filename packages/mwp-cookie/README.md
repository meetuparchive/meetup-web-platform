# mwp-cookie

A cookie management library

## Writing cookies in React - `<Cookie />`

To support writing cookies both on the server and the client in a 'universal'
React application, use the `<Cookie />` component in `src/Cookie.jsx`.

In the client, this component will write to `window.document.cookie` every time
it is rendered, using the supplied props to configure the cookie behavior (e.g.
time-to-live, `domain`). On the server, this component exposes the props for each
instance rendered by `ReactDOMServer.renderToString()` or `.renderToStaticMarkup`
through a `Cookie.rewind()` static interface.

In your application code, a basic `<Cookie />` requires a `name` prop and the
string `value` as the element's only child.

```jsx
<Cookie name="MY_COOKIE">my cookie value</Cookie>
```

This component does not currently _read_ cookies.

### Props

```js
<Cookie name="MY_COOKIE" ttl=1234 isHttpOnly isSecure path='/foo' domain='foo.meetup.com'>
  My cookie value
</Cookie>
```

#### `name: string`

**Required.** The name of the cookie to write

#### `children: string`

The value of the cookie.

#### `ttl: number`

_Optional._ Time to live in milliseconds. Will be used to write cookie's max-age and/or
'expires' header, as appropriate. If not supplied, the cookie will be a session
cookie that expires when the browser is closed.

#### `isHttpOnly: boolean`

_Optional - default `false`._ Cookies that are _only_ used on the server should use this prop to
avoid any interaction with client code.

This should be used for most cookies that are used for designating Fastly backends,
e.g. when replatforming a Meetup feature.

#### `isSecure: boolean`

_Optional - default `true`._ This cookie will only be sent by the browser over
a secure (HTTPS) connection. It should almost never be set to `false`.

#### `path: string`

_Optional - default `'/'`._ The URL root path on which this cookie will be sent
by the browser. The default will make this cookie available across the whole site,
which is generally the expected cookie behavior.

#### `domain: string`

_Optional - default `'.meetup.com'`_ The domain on which the cookie will be served.
The default will supply the cookie on all subdomains (including dev), which is
generally the expected cookie behavior.

### Recipes

#### Universal cookie setting

'Setting a cookie' during server-side rendering specifically means returning a
`Set-Cookie` header to the client along with the response body - it's a side
effect of the render. In the browser, setting a cookie means assigning a new
`window.document.cookie` string.

On the server, the rendering function needs to access the cookie data _after_
rendering, but _before_ returning the response in order to set the approppriate
header.

In Hapi, the code for a request handler might look like this:

```js
const Cookie = require('@meetup/mwp-cookie/lib/Cookie');
const App = require('./path/to/my/App.jsx'); // App renders multiple '<Cookie />' instances

const handler = (request, h) => {
	const markup = ReactDOMServer.renderToString(<App />);
	const response = h.response(markup);

	const cookieMap = Cookie.rewind();
	Object.keys(cookieMap).forEach(name => {
		const { value, ...options } = cookieMap[name];
		// assign new 'Set-Cookie' header per cookie in the map
		response.state(name, value, options);
	});

	return response;
};
```

On the client, the updates to `window.document.cookie` are handled internally -
just render the `<Cookie />` element.

```jsx
React.render(document.body, <App />);
```

#### Server-side-only cookie (`httpOnly`)

If you don't want the client to interact with a cookie at all, pass in the
`isHttpOnly` boolean prop.

```jsx
<Cookie name="MY_COOKIE" isHttpOnly>
	my cookie value not visible to client code
</Cookie>
```

#### Client-side-only cookie

The `<Cookie />` element is generally the wrong abstraction for setting cookies
on the client, since client-side cookie setting is by definition done with
callbacks (e.g. `componentDidMount`, `onClick`) that do not need to interact
with app rendering.

We recommend using [js-cookie](https://github.com/js-cookie/js-cookie/) in these
cases, with its `Cookie.set()` method.
