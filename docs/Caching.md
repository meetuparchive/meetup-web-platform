# Caching

Web platform apps cache data at a few different levels in order to improve UI
responsiveness. There are two primary types of content that are cached:

1. REST API responses
2. Static assets (files)

## Overview

![Cache diagram](https://user-images.githubusercontent.com/1885153/27892985-d75546fe-6256-11e7-8272-66252caa5c85.png)

([from web platform diagrams](https://docs.google.com/presentation/d/1c8jf8UtGa81Ay4oqlbHfoP4Ile2VkiRVrCMVag6cRBQ/#slide=id.g1f921bb8da_0_0))

## 1. API responses

Currently the Meetup REST API does not provide a
[`Cache-Control` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
(e.g. `max-age`), so the 'raw' API responses cannot be directly cached at the
app server or browser level - the app must re-fetch every API request from the 
browser to ensure that it delivers the requested data.

### CDN

The CDN does not currently cache any API responses. [See the 'Future'
discussion](#future) for potential changes to the behavior.

### App server

The app server does not currently cache any API responses. [See the 'Future' 
discussion](#future) for potential changes to the behavior.

### Browser

The browser uses
[IndexedDB](https://developer.mozilla.org/en/docs/Web/API/IndexedDB_API) for
local storage of API response data - it caches the JSON response rather than the
full HTTP response in order to avoid complexity arising from the batched API
request/response routine.

#### Service Worker

The service worker does not cache API requests/responses (and probably
shouldn't - [see the 'Future' discussion](#future)).

#### Cache middleware

The cache epic (middleware) provides optimistic `state` updates for any data
specified by dispatched `GET` queries, similar to the Sync epic, but uses
locally cached data rather than an HTTP response. It is client-side only, and it
*does not suppress* data fetched from the server - it simply pre-empts it before
the API response returns and overwrites everything with the latest server data.
[See the 'Future' discussion](#future) for potential changes to this behavior.

##### Cache lifecycle

**on `API_REQ`**, which provides `queries` to be sent to the API:

1. For each query, use the JSON-encoded query as a key into the cache
2. Format responses from the cache to look like API responses
3. Trigger `CACHE_SUCCESS` containing the cache hits

**on `API_SUCCESS`**,  which provides fresh info from the server

- make an entry in the cache with `key` as the JSON-encoded `query` and
	the `value` as the corresponding `response`

The cache is stored locally in the user's browser using IndexedDB so that it
will survive multiple sessions. All API queries are stored, and the data is
refreshed each time the query is re-requested.

In dev, be aware that the cache may be masking failed API requests - keep your
network dev tools open and watch the server logs to make sure you haven't broken
anything.

### Future

The core engineering team is working on improving cache handling at the REST API
layer, which should eventually include `Cache-Control` headers in API responses.
For real-time data, this cache would be short-lived, but for something like a
past event, the cache time could be very long.

Because the web platform batches API requests and responses, it will have to
carefully handle these cache rules at both the app server and browser app
levels.

1. **App server** - cache REST API responses

    At a minimum, the Node app server could maintain a lightweight (Redis?) local
cache of API responses with the correct cache control rules applied. This would
still require the browser application to make an HTTP API request for each
active query, but the response would be delivered faster in some cases because
the app server would not have to generate a corresponding HTTP request to the
REST API server.

2. **CDN** - cache batched API responses from app server

    The next level of caching could appear between the CDN and the browser
application. If the app server sent batched responses with a `Cache-Control`
header that matched the _minimum cache time_ of the individual API responses,
the CDN could be configured to cache those batched responses. For example, if
a request was made for a group event, the batched response would contain
responses from the _group endpoint_ and the _event endpoint_. The app server
could apply a `Cache-Control` header that matched the shortest cache
time-to-live of those two responses, and the CDN could cache that combined
response and deliver it to _every user who subsequently made the same batched
request_. This cache behavior would not be useful if every batched request
included an un-cacheable response (e.g. a private/logged-in response, like 
`/members/self`), so it would have to be developed after the app was updated to
cache individual API responses and only request stale data, as described below.

3. **Redux middleware** - cache parsed API responses and filter `fetch`

    The next level of caching would require changes to the query-based API proxy
routine. Each individual query response would need to contain the cache control
rules of the corresponding REST API response so that the browser could
appropriately cache the responses _and avoid making the same query request_
while the browser-cached response was available. A complintary caching stategy
could be applied at the CDN layer - if the CDN was configured to cache responses
from the `/mu_api` endpoint based on

    Although a service worker might be able to provide a 'transparent' caching
solution, the batched requests and responses would be awkward to parse in order
to correctly refine them to include only stale data.

    Instead, cache control rules should probably be handled by a more sophisticated 
interaction between the Sync epic (middleware) and the Cache epic
to allow `fetch` requests to be modified (or cancelled) when cached data was
available for the requested queries. We would probably still want to use the
Cache epic to cache everything so that the UI was responsive even when 'fresh'
data was being fetched, but the cache control rules would allow the `fetch` to
be fine-tuned to include only the data that was known to _require_ an update.

## 2. Static assets

Static assets generated by the build are cached in our CDN and in the browser.
Because each filename includes a hash of the file contents, the file can have an
infinite cache lifetime.

### CDN

(CDN cache invalidation policy?)

### Browser

All static assets are delivered to the browser with a `Cache-Control` header
with a a 10 year expiration. For
[browsers that do not support Service Workers](https://jakearchibald.github.io/isserviceworkerready/),
normal browser cache rules apply - static assets will be cached as they are
requested by the app, but not before. For browsers that _do_ support service
workers, the platform service worker will 'pre-cache' all bundled assets
asynchronously after the in-page assets load, and serve those assets from the
browser cache for all future requests.

When new assets are generated, a new service worker is generated. When a client
loads the site, the new service worker will replace any existing service workers
and immediately start downloading new static assets. Any un-changed static
assets (hashed filename unchanged) will not be re-downloaded.
