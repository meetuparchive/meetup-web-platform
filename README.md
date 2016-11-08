[![npm version](https://badge.fury.io/js/meetup-web-platform.svg)](https://badge.fury.io/js/meetup-web-platform) [![Build Status](https://travis-ci.org/meetup/meetup-web-platform.svg?branch=master)](https://travis-ci.org/meetup/meetup-web-platform) [![Coverage Status](https://coveralls.io/repos/github/meetup/meetup-web-platform/badge.svg?branch=master)](https://coveralls.io/github/meetup/meetup-web-platform?branch=master)

# Web platform

This is the base platform for serving Meetup web apps including the public
website and admin. It provides a Hapi webserver and a set of conventions for
composing applications with React + Redux.

In general, application-specific code will live outside of this package.

# Releases

This package uses semver versioning to tag releases, although the patch version
is determined exclusively by the Travis build number for pushes to `master`.
Major and minor versions are hard-coded into the [Makefile](Makefile#L2).

Manual pushes to `master` and PR merges to master will be built by Travis, and
will kick off the npm publish routine. The currently-published version of the
package is shown on the repo homepage on GitHub in a badge at the top of the
README.

## Development/Beta releases

When developing a consumer application that requires changes to the platform
code, you can release a beta version of the platform on npm by opening a PR in
the meetup-web-platform repo. When it builds successfully, a new beta version
will be added to the list of available npm versions. The generated version number
is in the Travis build logs, which you can navigate to by clicking on 'Show all
checks' in the box that says 'All checks have passed', and then getting the
'Details' of the Travis build.

<img width="797" alt="screen shot 2016-10-29 at 10 25 20 am" src="https://cloud.githubusercontent.com/assets/1885153/19822867/26d007dc-9dc2-11e6-8059-96d368411e78.png">

<img width="685" alt="screen shot 2016-10-29 at 10 25 29 am" src="https://cloud.githubusercontent.com/assets/1885153/19822869/28d1f432-9dc2-11e6-8157-3d381746f315.png">

At the bottom of the build log, there is a line that `echo`s the `GIT_TAG`.
If you click the disclosure arrow, the version number will be displayed, e.g.
`0.5.177-beta`.

<img width="343" alt="screen shot 2016-10-29 at 10 25 59 am" src="https://cloud.githubusercontent.com/assets/1885153/19822874/312a9792-9dc2-11e6-97bc-62f61d252d4e.png">

<img width="418" alt="screen shot 2016-10-29 at 10 26 06 am" src="https://cloud.githubusercontent.com/assets/1885153/19822876/34182e9c-9dc2-11e6-9901-c8e68591dc12.png">

You can then install this beta version into your consumer application with

```sh
> npm install meetup-web-platform@<version tag>
```

Each time you push a change to your `meetup-web-platform` PR, you'll need to
re-install it with the new tag in your consumer application code.

The overall workflow is:

1. Open a PR for your `meetup-web-platform` branch
2. Wait for Travis to successfully build your branch (this can take 5+ minutes)
3. Get the version string from the build logs under `GIT_TAG`
4. (if needed) Push changes to your `meetup-web-platform` branch
5. Repeat steps 2-3

# Introductory Resources

Basic knowledge of reactive programming using RxJS 5 is a pre-requisite for being
able to work in this repository. https://www.learnrxjs.io/ manages a good
list of starting resources, specifically:

- [RxJS Introduction](http://reactivex.io/rxjs/manual/overview.html#introduction) - Official Docs
- [The Introduction to Reactive Programming You've Been Missing](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754) - André Staltz
- [Asynchronous Programming: The End of The Loop](https://egghead.io/courses/mastering-asynchronous-programming-the-end-of-the-loop) - Jafar Husain
- [Introduction to Reactive Programming](https://egghead.io/courses/introduction-to-reactive-programming) - André Staltz
- [Functional Programming in Javascript](http://reactivex.io/learnrx/) - Jafar Husain

Suggestions:
- Reference the api docs regularly while watching videos (http://reactivex.io/rxjs/).
- Play around with the JSBin in the egghead.io videos (`console.log` to each transformation step, etc).


# Modules

## Server

The [server module](./src/server.js) exports a `startServer` function that consumes
a mapping of locale codes to app-rendering Observables, plus any app-specific
server routes and plugins. See the code comments for usage details.

## API Adapter

When the application server receives the JSON-encoded array of queries,
it uses an API adapter module to translate those into the configuration
needed to fetch data from an external API. The application server is
therefore the only part of the system that needs to know how to
communicate with the API.

This adapter is used to proxy all requests to `/api`.

From the client-side application's point of view, it will always send
the `queries` and recieve the `queryResponses` for any data request -
all the API-specific translations happen on the server.

## Middleware/Epics

The built-in middleware provides core functionality for interacting with
API data - managing authenticated user sessions, syncing with the current
URL location, caching data, and POSTing data to the API.

Additional middleware can be passed to the `makeRenderer` function for
each specific application's client and server entry points.

### Epic middleware

Based on `redux-observable`, this middleware provides the following
functionality through "Epics":

#### Auth `epics/auth.js`

_in development - API will provide most auth needs_

Auth/login requires side-effect interaction with an authentication server, which has an endpoint distinct from the
regular data API - the current branch implements it as part of the API server, responding to requests to `/api/login`.

**on `LOGIN_REQUEST`**, which provides `credentials`

1. Format `credentials` for API using a `query` for login
2. Make API call
3. Trigger `LOGIN_SUCCESS` containing API response (could format before triggering action if needed)
4. Write auth cookie to maintain login across sessions

**on `LOGOUT`** (no attached data)

- delete auth cookie (not currently implemented)
- clearing local state is not a side effect, so it's handled directly by the `auth` reducer in `coreReducers`

#### Sync `epics/sync.js`

This epic is currently only responsible for fetching the data from the API server on initial render or client-side
user navigation.

**on `server/RENDER` or `LOCATION_CHANGE`**, which provide a `location` (URL):

1. Match `location` to defined `routes` and extract the `renderProps` like URL path  and querystring params
2. Check `routes` for `query` functions that return data needs, and process them into an array
3. Trigger `API_REQUEST` containing the `queries`

**on `API_REQUEST`**, which provides `queries`:
1. Send the queries to the application server, which will make the
	 corresponding external API calls.
2. When the application server returns data, trigger `API_SUCCESS` action containing API response array and query array
3. If the application server responds with an error, trigger `API_ERROR`

_Interesting feature_: `navRenderSub` is a `Rx.SerialDisposable`, which means that when a user navigates to a new page,
any "pending" API requests will *not be processed*. This is a Very Good Thing because it means that we won't be calling
`API_COMPLETE` for a page load that is no longer applicable. A similar tool is used for the AuthEpic so that only
one login request can be processed, but it's less likely to be an issue there since it's rare that users would be trying
to log in repeatedly without waiting for previous login requests to be processed.

#### Cache `epics/cache.js`

The cache epic provides optimistic `state` updates for any data specified
by active route queries, similar to the SyncEpic, but using locally
cached data rather than an API. It is client-side only, and it *does not suppress*
data fetched from the server - it simply pre-empts it before the API response
returns and overwrites everything with the latest server data.

**on `API_REQUEST`**, which provides `queries` for the requested route

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
anything. We will add tooling to make such cases more obvious in the future.

##### Disable cache

By design, the cache masks slow responses from the API and can create a 'flash'
of stale content before the API responds with the latest data. In development,
this behavior is not always desirable so you can disable the cache by adding
a `__nocache` param to the query string. The cache will remain disabled until the
the page is refreshed/reloaded without the param in the querystring.

```
http://localhost:8000/ny-tech/?__nocache
```

### POST

`POST` API requests are handled by `PostMiddleware`, which provides a generalized
interface for sending data to the API and handling return values. The middleware
only responds to actions that have a `POST_` prefix or a `_POST` suffix in the
action `type`. Furthermore, the `action.payload` must have a Query object (with
a `type`, `ref`, and `params`) as well as `onSuccess` and `onError` actionCreators
to receive the data response from the API - they _must_ be actionCreators because
their return values will be `dispatch`ed by the middleware in the API success/error
case.

Use reducers to parse the response and update application state.

## Tracking

When starting the server, applications provide a `platform_agent` identifier,
e.g. `'mup-web'` that is used to tag all of the automatically-generated
tracking data produced by platform-related activity, including data requests,
browser sessions and login/logout actions. Over time, this system will expand
to include click tracking and other types of tracking defined by the Data team
and implemented through platform-provided unique IDs.

More info in Confluence [here](https://meetup.atlassian.net/wiki/display/WP/Tracking+data+needs)

