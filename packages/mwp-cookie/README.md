# mwp-cookie

A cookie management library

## Interacting with cookies in React

This library provides React components that allow you to connect an environment's
cookies with the applications, both for reading and writing.

In the browser, this means reading and writing `window.document.cookie`.

On the server, this means reading the `Cookie` header on the request object, and
writing `Set-Cookie` response headers.

### Mapping get/set to the environment

The get/set functionality is injected into your app through a React Context provider.
This library provides two high-level providers, one for Hapi-based Node servers
(`HapiCookieProvider`) and one for browsers (`BrowserCookieProvider`), although
you can also write your own provider using the lower-level `CookieProvider` component
that accepts custom `get` and `set` functions.

_Note_: In 'full' MWP apps (e.g. mup-web and pro-web), the provider is supplied
automatically - you should not need to explicitly import and render it yourself.

#### `<HapiCookieProvider />`

If you are rendering your app in a Hapi server (v17+) You will need to wrap your
server-side `<App />` with `HapiCookieProvider`, which accepts the Hapi `request`
object and `h` response toolkit as props:

```jsx
import HapiCookieProvider from '@meetup/mwp-cookie/lib/HapiCookieProvider';

const handler = (request, h) => {
	return ReactDOMServer.renderToString(
		<HapiCookieProvider request={request} h={h}>
			<App />
		</HapiCookieProvider>
	);
};
```

#### `<BrowserCookieProvider>`

In the browser application, wrap your `<App />` with `BrowserCookieProvider`, which
will interact directly with `window.document.cookie` - no props needed.

```jsx
import BrowserCookieProvider from '@meetup/mwp-cookie/lib/BrowserCookieProvider';

ReactDOM.render(
	<BrowserCookieProvider>
		<App />
	</BrowserCookieProvider>,
	document.getElementById('root')
);
```

### Reading cookies in React - `<GetCookie />`

`<GetCookie />` is a component that provides access to cookies in the rendering
environment. Like all [React Context Consumers](https://reactjs.org/docs/context.html#contextconsumer),
it request a [_function_ as a child](https://reactjs.org/docs/render-props.html#using-props-other-than-render).
This child function will be called with the value of the cookie named by an optional
`name` prop, or a map of _all_ available cookie values if rendered without a
`name` prop.

```jsx
import { GetCookie } from '@meetup/mwp-cookie/lib/Cookie';

<GetCookie name="MY_COOKIE">
	{myCookieValue => <p>My cookie value is {myCookieValue}</p>}
</GetCookie>

// or

<GetCookie>
	{cookieMap => <p>These are all the cookies: {JSON.stringify(cookieMap)}</p>}
</GetCookie>
```

_Note_: In general, you should try to be precise/explicit with the cookies you
read in any particular context - you should rarely need to load _all_ the cookies
into your application in one component.

_Note_: In the browser, you will not be able to access any `httpOnly` cookies.

### Writing cookies in React - `<SetCookie />`

To write cookies, use the `<SetCookie />` component.

A basic `<SetCookie />` requires a `name` prop and the string `value` as the
element's only child.

```jsx
import { SetCookie } from '@meetup/mwp-cookie/lib/Cookie';

<SetCookie name="MY_COOKIE">my cookie value</SetCookie>;
```

#### Cookie configuration props

```js
<SetCookie name="MY_COOKIE" ttl=1234 isHttpOnly isSecure path='/foo' domain='foo.meetup.com'>
  My cookie value
</SetCookie>
```

##### `name: string`

**Required.** The name of the cookie to write

##### `children: string`

The value of the cookie.

##### `ttl: number`

_Optional._ Time to live in milliseconds. Will be used to write cookie's max-age and/or
'expires' header, as appropriate. If not supplied, the cookie will be a session
cookie that expires when the browser is closed.

##### `isHttpOnly: boolean`

_Optional - default `false`._ Cookies that are _only_ used on the server should use this prop to
avoid any interaction with client code.

This should be used for most cookies that are used for designating Fastly backends,
e.g. when replatforming a Meetup feature.

##### `isSecure: boolean`

_Optional - default `true`._ This cookie will only be sent by the browser over
a secure (HTTPS) connection. It should almost never be set to `false`.

##### `path: string`

_Optional - default `'/'`._ The URL root path on which this cookie will be sent
by the browser. The default will make this cookie available across the whole site,
which is generally the expected cookie behavior.

##### `domain: string`

_Optional - default `'.meetup.com'`_ The domain on which the cookie will be served.
The default will supply the cookie on all subdomains (including dev), which is
generally the expected cookie behavior.

### Recipes

#### Server-side-only cookie (`httpOnly`)

If you don't want the client to interact with a cookie at all, pass in the
`isHttpOnly` boolean prop.

```jsx
<SetCookie name="MY_COOKIE" isHttpOnly>
	my cookie value not visible to client code
</SetCookie>
```

#### Client-side-only cookie

The `<SetCookie />` element is generally the wrong abstraction for setting cookies
on the client, since client-side cookie setting is by definition done with
callbacks (e.g. `componentDidMount`, `onClick`) that do not need to interact
with app rendering.

We recommend using [js-cookie](https://github.com/js-cookie/js-cookie/) in these
cases, with its `SetCooke.set()` method.
