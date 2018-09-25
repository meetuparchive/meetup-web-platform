# Tracking

## Overview

## Logging

The tracking logs are Avro-encoded and serialized to JSON according to the
[Analytics Logging](https://meetup.atlassian.net/wiki/display/MUP/Analytics+Logging) spec.

In Google App Engine, we use [Google Pub/Sub](https://googlecloudplatform.github.io/google-cloud-node/#/docs/pubsub/0.9.0/pubsub/topic?method=Topic)
to publish tracking data to a pre-defined 'topic'.

The Pub/Sub configuration will only activate when the `GAE_INSTANCE` environment
variable is set. In addition, the environment must be configured to
automatically authenticate with Google Cloud.

In production, Pub/Sub authentication is handled automatically by the runtime
environment.

### Logging development activity

In development, you will need to use the `gcloud SDK` to configure
your environment to send activity logs to Google Pub/Sub with the following
command:

```
$ gcloud auth application-default login
```

Once set up, you can run the application in 'GAE' mode with

```
$ GAE_INSTANCE=foo yarn start
```

or an equivalent startup command. Tracking data from this dev instance should
then be consumed by an analytics back end, although you will need to work with
the data team to find the records it produces - they are not shown in the Google
App Engine web console.

Note that we do not currently have a unique place to store tracking data from
dev, so any tracking data that you produce will be merged into production
tracking data. For small amounts of data, this shouldn't significantly affect
analytics.

## Activity tracking

Activity tracking is provided by a `request.trackActivity` method, which has two
responsibilities:

1. Manage tracking IDs that are passed into the request through cookies
2. Log the formatted, encoded tracking ID state of the request to `stdout`

## Click tracking

Click tracking consists of 4 related modules:

1. `clickParser` for converting a DOM click or change event into a click record
2. `clickState` for connecting click records to a cookie 'history'.
3. `clickReader` for reading the click tracking data cookie on the server.

Ultimately, the only 'fixed' requirements are that the click tracking data must
be passed to the server in a cookie, and the serialization of that data must be
handled by the click tracking plugin/module - it is designed to work seamlessly
with parallel behavior implemented in Meetup Classic.

### Behavior

`browserInit` can be called by a client application whenever it is ready to start
listening for clicks (usually in `componentDidMount` in the application wrapper
component). The platform does the rest. The init code attaches `click` _and_
`change` listeners to the `<body>`. Each `click` and `change` event is converted
to a click record and stored in a cookie that will be sent to the server on the
next HTTP request.

Server routes must opt-in to consuming the click cookie using `route.options.plugins['mwp-tracking-plugin']`,
which should define an object with a `click` property defining a function that
accepts the `request` as an argument and returns `true` when the click cookie
should be read (e.g. based on querystring parameters or other header info).

Example:

```js
const route = {
	method: 'GET',
	path: '/foo',
	config: {
		plugins: {
			'mwp-tracking-plugin': {
				// only track clicks when `?trackClicks=true` in querystring
				click: request => Boolean(request.query.trackClicks),
			},
		},
	},
};
```

The click plugin will 'unset' the click tracking cookie when the data has been
consumed.
