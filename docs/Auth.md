# Auth

Authentication and authorization through the Meetup API is part of every web
platform application, and is handled invisibly by the platform server - the
consumer apps do not need to know anything about how their API requests are
authenticated. It is a _cookie-based_ auth system, so the server is responsible
for reading and writing the relevant cookies from/to the browser client with
every request.

There are two auth cookies:

1. `oauth_token` - expiration time determined by the authentication endpoint
2. `refresh_token` - does not expire, but will be set to a new token whenever
one is received from the authentication endpoint.

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

The `requestAuth` plugin also sets a handler for the Hapi server's
[`'onPreAuth'` extension point](http://hapijs.com/api#request-lifecycle)
that will store a reference to the current request's `reply` interface in order
to set cookies on the response, if necessary.

## Request auth lifecycle

In the `auth` step of the [Hapi request lifecycle](http://hapijs.com/api#request-lifecycle),
which happens _before_ the route handler is invoked, the `requestAuthPlugin`
`authenticate` function is run, which handles all aspects of authenticating the request

1. Does the request contain a `logout` query param?
  - **YES**: clear all auth cookies from the request
  - **NO**: continue
2. Does the request contain an `oauth_token` cookie?
  - **YES**: continue
  - **NO**: Does the request contain a `refresh_token` cookie?
    - **YES**: Get a new access token using the `refresh_token` grant
    - **NO**
      - Get a new anonymous grant code
      - Get a new anonymous access token using the `anonymous_code` grant
    - Apply the new `oauth_token` to the `request` **AND** the `reply` to send
      it back to the client
3. If the Meetup API is being called (which is basically for all requests), the
`oauth_token` in the request cookie will be converted to an `Authorization` header
in each request to the Meetup API - this happens in [`api-proxy.js:parseRequest`](../apiProxy/api-proxy.js)

## Login

Logging in is a special kind of API request that needs to set new `reply` cookies
from the `api-proxy` module - it is independent of the `requestAuthPlugin` but
must set cookies with the same format so that they can be used by
`requestAuthPlugin` for future requests. When the `api-proxy` makes
its API requests, it looks for login-related data in the API response:
  - Assume that the request was made by a POST from the browser (the app server never
    generates a login request on its own), which allows response cookies to be set
  - Does the API response contain data under the `'login'` key?
    - **NO**: return response directly
    - **YES**
      - Assume the response is formatted like a response from the `/sessions`
        API endpoint
      - read the `oauth_token`, `refresh_token`, and `expires_in` data from
        the API response
      - Create and apply new oauth cookies to the `reply` to set the new cookies
        in the browser
      - return _only_ the `member` data, not the auth data, as the API response

## Logout

Logging out is handled by `requestAuthPlugin` as described above. However, since it
is querystring-based when navigating the app, and app navigation doesn't _directly_ hit
the app server, the [`fetchUtils.js:fetchQueries`] function is responsible for
injecting the `logout` querystring property when creating a navigation-based API request
to the `/api` endpoint - it does this by checking whether the current _app_ location
contains the querystring value, and adds it to the `/api` request querystring if so.

The response to this `/api` request will provide logged-out data and new 'anonymous user'
oauth tokens in the `Set-Cookie` header.
