# API proxy plugin

The API proxy plugin provides methods for requesting data from the Meetup REST
API using [Queries](../../../docs/Queries.md). It provides two major features
to a server.

1. a `request.proxyApi(queries, activityInfo)` method that will generate REST API requests
for `queries` that are passed in as an argument
2. a route for HTTP requests from the application, which default to `/mu_api`.

# `request.proxyApi(queries, activityInfo)`

- *`queries`: `Array<Query>`* - array of query objects to proxy
- *`activityInfo`: `{ string: string }`* - map of Activity record data to record

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
