## API Adapter

### Query

The app server expects API requests to be provided in the form of `query`
objects in the payload of a single request to the app server at the `/api`
endpoint. A query takes the following shape:

```js
{
	type: <string>,
	params: {
		<string>: <string>,
		...
	},
	ref: <string>,
	flags?: [<string>, ...],
}
```

When the application server receives the JSON-encoded array of queries,
it uses an API adapter module to translate those into the configuration
needed to fetch data from an external API. The application server is
therefore the only part of the system that needs to know how to
communicate with the API.

This adapter is used to proxy all requests to `/api`.

From the client-side application's point of view, it will always send
the `queries` and recieve the `queryResponses` for any data request -
all the API-specific translations happen on the server.

A `queryResponse` takes the following shape:

```js
{
	<string (ref)>: {
		value?: <parsed API response JSON>
		flags?: {
			<string>: <Boolean>
			...
		},
		error?: <string>
	}
}
```

### Feature flags

The API adapter provides an interface into feature flag values - just pass
an array of feature flag names in the `flags` array of your query, and the
response from the API adapter will return an object mapping the flag names to
their true/false valuse in the `flags` property of the response. Your
application will probably add these flag values directly to the Redux `state`,
where they can be consumed by components to affect the UI.

### Faking an API response

Sometimes, during development, you might want to set up your consumer app to
query data from an API endpoint that is not yet set up. In this case, you can
add a `mockResponse` property to your `query` object that will be used as the
return value for the API call (you _have_ defined the API return values,
right?). When the API endpoint is ready, simply remove the `mockResponse` from
the query and the platform will call the API as configured in
`src/apiProxy/apiConfigCreators.js`.

**Example**

A new feature will use a new API `/:urlname/candy` endpoint - it returns a new
`type` of data called `candy` with an `id` and `flavor` property.

The query function in the consumer app would look like this:

``` js
function candyQuery({ params, location }) {
  const urlname = params.urlname;
  return {
    type: 'candy',
    params: { urlname },
    ref: 'candystate',
    mockResponse: {
      id: 1234,
      flavor: 'kiwi'
  };
}
```

the `apiConfigCreator` would need to be defined like this:

``` js
function candy(params) {
  return {
    endpoint: `${params.urlname}/candy`,
    params
  };
}
```

Then, even if the API server isn't handling `/:urlname/candy` yet, the app will
load the `mockResponse` into Redux state at `state.app.candystate.value`.

### Debugging API requests/responses

The server log will show data about the Meetup API requests it generates in
response to incoming queries, although it will truncate the `body` of the
response to 256 characters, which should be sufficient to see the cause of
API errors:

```
2016-11-23 22:56:41.901, [request,api,info] data: {
  "request": {
    "query": {
      "id": "self"
    },
    "pathname": "/2/member/self",
    "method": "get"
  },
  "response": {
    "elapsedTime": 722,
    "body": "{\"service_status\":{\"status\":\"ok\"},\"org_badge\":false,\"categories\":[{\"id\":242,\"shortname\":\"outdoors-adventure\",\"name\":\"???chapter_meta_cat.outdoors-adventure.name???\",\"sort_name\":\"???chapter_meta_cat.outdoors-adventure.name???\",\"photo\":{\"id\":450131943,\"highr..."
  }
}
```

To see the full body of the response, you might be able to inspect network
traffic using something like Charles proxy.

