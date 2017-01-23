# Auth

Authentication and authorization through the Meetup API is part of every web
platform application, and is handled invisibly by the platform server - the
consumer apps do not need to know anything about how their API requests are
authenticated. It is a _cookie-based_ auth system, so the server is responsible
for reading and writing the relevant cookies from/to the browser client with
every request.

There are two auth cookies for logged-out users:

1. `oauth_token` - expiration time determined by the authentication endpoint
2. `refresh_token` - does not expire, but will be set to a new token whenever
one is received from the authentication endpoint.

And one cookie for logged-in users: `MEETUP_MEMBER` (or `MEETUP_MEMBER_DEV`)

## Overview

Authentication is handled by the [`requestAuth` plugin](../plugins/requestAuthPlugin.js),
which registers an 'oauth' scheme on the `server` instance. Once the `'oauth'`
scheme is registered with the server, it must be applied as a `server.auth.strategy`,
which happens when the server starts in the
[`server` function of the `serverUtils` module](../util/serverUtils.js).

The `'oauth'` scheme provides an `authenticate` function that reads
and writes auth cookies that will allow the request source (browser or server)
to call the Meetup API. This function requires the platform's oauth consumer
`KEY` and `SECRET`.

## Request auth lifecycle

In the `auth` step of the [Hapi request lifecycle](http://hapijs.com/api#request-lifecycle),
which happens _before_ the route handler is invoked, the `requestAuthPlugin`
`authenticate` function is run, which handles all aspects of authenticating the request

1. Does the request contain a `logout` query param?
  - **YES**: clear all auth cookies from the request
  - **NO**: continue
2. Does the request contain an `oauth_token` or `MEETUP_MEMBER` cookie?
  - **YES**: continue
  - **NO**: Does the request contain a `refresh_token` cookie?
    - **YES**: Get a new access token using the `refresh_token` grant
    - **NO**
      - Get a new anonymous grant code
      - Get a new anonymous access token using the `anonymous_code` grant
    - Apply the new `oauth_token` to the `request` **AND** the `reply` to send
      it back to the client
3. If the Meetup API is being called (which is basically for all requests), the
`MEETUP_MEMBER` cookie will be forwarded for logged-in requests, or the
`oauth_token` cookie will be converted to an `Authorization` header
in each request to the Meetup API - this happens in
[`api-proxy.js:parseRequest`](../apiProxy/api-proxy.js)
4. The API proxy will also generate and send a UUID CSRF cookie and header,
which is generated fresh for every API request. The only constraint is that the
header and cookie are identical.

## Login

Logging in is a special kind of API request that receives a new MEETUP_MEMBER
cookie from the `/sessions` API endpoint that must be forwarded to the browser.
When the `api-proxy` makes its API requests, it creates a 'cookie jar' to store
cookies that are returned by the API (when necessary). When processing each API
response, the API proxy reads from this cookie jar and sends the cookies along
to the browser.

The API proxy also strips oauth-related data from the `/sessions` response in
order to avoid leaking auth information.

## Logout

Logging out is handled by `requestAuthPlugin` as described above. However, since logout
is querystring-based when navigating the _app_ URLs, and SPA navigation doesn't _directly_
hit the app server, the [`fetchUtils.js:fetchQueries`](../util/fetchUtils.js) function is responsible for
injecting the `logout` querystring property when creating a navigation-based API request
to the `/mu_api` endpoint - it does this by checking whether the current _app_ location
contains the querystring value, and adds it to the `/mu_api` request querystring if so.

The response to this `/mu_api` request will provide logged-out data and new 'anonymous user'
oauth tokens in the `Set-Cookie` header.
