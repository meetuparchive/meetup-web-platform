# Auth

Authentication and authorization through the Meetup API is part of every web
platform application, and is handled invisibly by the platform server - the
consumer apps do not need to know anything about how their API requests are
authenticated. It is a _cookie-based_ auth system, so the server is responsible
for reading and writing the relevant cookies from/to the browser client with
every request.

## Overview

Once the `'mwp-auth'` scheme is registered with the server, it must be applied
as a `server.auth.strategy`, which happens when the server starts in the
[`server` function of the `mwp-app-server` package](../mwp-app-server/util/index.js).

The `'mwp-auth'` scheme provides an `authenticate` function that reads auth info
from each request and supplies fallback values when necessary.

Once processed by `mwp-auth`, the request will have auth credentials stored in
`request.auth.credentials`:

```json
{
  "memberCookie": string,
  "csrfToken": string
}
```

These values can be used when making API requests - the CSRF token must be
supplied as a `MEETUP_CSRF` cookie as well as a `csrf-token` header, and the
member cookie string must be supplied as a `MEETUP_MEMBER` cookie.