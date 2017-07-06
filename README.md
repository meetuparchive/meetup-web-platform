[![npm version](https://badge.fury.io/js/meetup-web-platform.svg)](https://badge.fury.io/js/meetup-web-platform)
[![Build Status](https://travis-ci.org/meetup/meetup-web-platform.svg?branch=master)](https://travis-ci.org/meetup/meetup-web-platform)
[![Coverage Status](https://coveralls.io/repos/github/meetup/meetup-web-platform/badge.svg?branch=master)](https://coveralls.io/github/meetup/meetup-web-platform?branch=master)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)


# Web platform

This is the base platform for serving Meetup web apps including the public
website and admin. It provides a Hapi webserver and a set of conventions for
composing applications with React + Redux.

In general, application-specific code will live outside of this package.

# Docs

- [API requests through api-proxy](docs/api-proxy.md)
- [App configuration management](docs/Config.md)
- [Auth flow from `requestAuthPlugin`](docs/auth.md)
- [Analytics/tracking](docs/Tracking.md)
- [Application state management](docs/State.md)
- ['Query': structuring data dependencies](docs/Queries.md)
- [Rendering in consumer applications](docs/Rendering.md)
- [Routing configuration](docs/Routing.md)
- [Caching - API and static assets](docs/Caching.md)

# Releases

This package uses semver versioning to tag releases, although the patch version
is determined exclusively by the Travis build number for pushes to `master`.
Major and minor versions are hard-coded into the [Makefile](Makefile#L2).

Manual pushes to `master` and PR merges to master will be built by Travis, and
will kick off the yarn publish routine. The currently-published version of the
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
> yarn install meetup-web-platform@<version tag>
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

See [the Caching docs](./docs/Caching.md#cache-middleware)

##### Disable cache

By design, the cache masks slow responses from the API and can create a 'flash'
of stale content before the API responds with the latest data. In development,
this behavior is not always desirable so you can disable the cache by adding
a `__nocache` param to the query string. The cache will remain disabled until the
the page is refreshed/reloaded without the param in the querystring.

```
http://localhost:8000/ny-tech/?__nocache
```

#### POST

`POST` API requests are handled by `PostMiddleware`, which provides a generalized
interface for sending data to the API and handling return values. The middleware
only responds to actions that have a `POST_` prefix or a `_POST` suffix in the
action `type`.

The `action.payload` must have a `query` property containing a Query object (with
a `type`, `ref`, and `params`). Optionally, it may supply `onSuccess` and/or
`onError` properties, which must be actionCreator functions that will be called
in addition to `apiSuccess` and `apiError`, respectively. The `onSuccess` and
`onError` action creators will receive the same arguments as `apiSuccess`
(`{ queries, responses }`) and `apiError` (`err`). 

Use reducers to parse the response and update application state.

## Client

### Rendering 'empty' state with `<NotFound>`

To correctly render a 'not found' state for a feature, you should render a
`<NotFound>` component, which the server will use to set the response status to
404.

#### Example:

```jsx
import NotFound from 'meetup-web-platform/lib/components/NotFound';

class GroupContainer extends React.Component {
	render() {
		if (!this.props.group) {
			return (
				<NotFound>
					<h1>Sorry, no matching group was found</h1>
				</NotFound>
			);
		}

		return <GroupDetail group={this.props.group} />;
	}
}
```

## Tracking

When starting the server, applications provide a `platform_agent` identifier,
e.g. `'mup-web'` that is used to tag all of the automatically-generated
tracking data produced by platform-related activity, including data requests,
browser sessions and login/logout actions. Over time, this system will expand
to include click tracking and other types of tracking defined by the Data team
and implemented through platform-provided unique IDs.

More info in Confluence [here](https://meetup.atlassian.net/wiki/display/WP/Tracking+data+needs)

# Dev patterns

## Async

Use Promises or Observables to handle async processing - the latter
tends to provide more powerful async tools than the former, particularly
for long processing chains or anything involving sequences of values,
but Promises are good for single async operations. _Do not write
functions that fire callbacks_.

When using Observables, you can always `throw` an Error and expect the
subscriber to provide an `onError` handler. When using Promises, call
`Promise.reject(new Error(<message>))` and expect that the caller will
provide a `.catch()` or `onRejected` handler.

## Error Handling

Guidelines:

1. Use `Error` objects liberally - they are totally safe until they are
	 paired with a `throw`, and even then they can be usefully
	 processed without crashing the application with a `try/catch`.
2. Use `throw` when there is no clear way for the application to recover from
   the error. Uncaught errors are allowed to crash the application and
	 are valuable both in dev and in integration tests.
3. Populate state with the actual `Error` object rather than just a
	 Boolean or error message String. Error objects provide better
	 introspection data. For example, a validation process might return
	 `null` (for no validation errors) or `new Error('Value is required')`
	 rather than `true` (for "is valid") or `false`.
4. Many errors will have an associated Redux action, such as
	 `LOGIN_ERROR` - keep the corresponding state updates
	 as narrow as possible. For example, `LOGIN_ERROR` should only affect
	 `state.app.login` - all affected UI components should read from that
	 property rather than independently responding to `LOGIN_ERROR` in a
	 reducer. _Do not create a high-level `error` properties state_
5. When using Promises or Observables, _always_ provide an error
	 handling function (`catch` for Promises, `error` for
	 Observables)

