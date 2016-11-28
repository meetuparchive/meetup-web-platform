# Queries

Queries (e.g. `src/app/root/appQuery.js`) have two requirements:

1. They are assigned as _props_ of React Router `Route`s .The `query` prop can
be either a single Query function or an array
2. They are pure functions that take the Router's `renderProps` (i.e. current
URL `location` and `params` extracted from the URL) and deliver a description
of the data needed for the route they are assigned to.

Queries are essentially declarative hooks into the "side effect" of
communication with an API.

The simplest way to describe the data a route needs is by providing the following properties:

1. The type of data expected (similar to specifying the TABLE in a SQL statement)
2. The parameters that are needed to select the matching objects (similar to WHERE)
3. A keyword to distinguish this `query` from any others that might ask for similar data

For example in the `groupQuery`, the query function returns:

 ```js
{
  type: 'group',
  params: { urlname },
  ref: GROUP_REF,  // route-unique string (ideally globally-unique)
}
```

`urlname` is one of the parameters extracted from the `/:urlname/` `Route`. The only information provided to a query
function is the `renderProps` from the route, so the parameters need to be extractable from something in the URL
(including query string and hash).

It is important to note that these queries are intended to be API-agnostic - they will be sent to the application server
for translation into external API calls.


