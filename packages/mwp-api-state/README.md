# API state

Redux state management for Meetup REST API data

## Middleware/Epics

The API middleware provides core functionality for interacting with
API data - managing authenticated user sessions, syncing with the current
URL location, caching data, and POSTing data to the API.

### Sync `/sync.js`

This epic is currently only responsible for fetching the data from the API
server on initial render or client-side
user navigation.

**on `SERVER_RENDER` or `LOCATION_CHANGE`**, which provide a `location` (URL):

1. Match `location` to defined `routes` and extract the `renderProps` like URL
   path and querystring params
2. Check `routes` for `query` functions that return data needs, and process
   them into an array
3. Trigger `API_REQ` containing the `queries`

**on `API_REQ`**, which provides `queries`:
1. Send the queries to the application server, which will make the
	 corresponding external API calls.
2. When the application server returns data, trigger `API_RESP_SUCCESS` action
   containing API response array and query array
3. If the application server responds with an error, trigger `API_RESP_ERROR`

### Cache `/cache.js`

See [the Caching docs](https://meetup.atlassian.net/wiki/spaces/WEG/pages/243499188/Caching)

#### Disable cache

By design, the cache masks slow responses from the API and can create a 'flash'
of stale content before the API responds with the latest data. In development,
this behavior is not always desirable so you can disable the cache by adding
a `__nocache` param to the query string. The cache will remain disabled until the
the page is refreshed/reloaded without the param in the querystring.

```
http://localhost:8000/ny-tech/?__nocache
```

## Reducer

The `api` export of the `api-state` module is a reducer that will return data
from the API using [Queries](Queries.md).

## Action creators

To send/receive data to/from the REST API, use `get`, `post`,
`patch`, `put` and `del` action creators from `api-state`.

See the [Queries documentation](Queries.md) for more details on usage.
