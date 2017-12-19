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

Click tracking consists of 3 related modules:

1. `clickWriter` for writing the click `Event` data to a Redux action.
2. `clickState` for defining Redux click actions and reducing those actions into
   Redux state, and writing click tracking data into a cookie.
3. `clickReader` for reading the click tracking data cookie on the server.

Ultimately, the only 'fixed' requirements are that the click tracking data must
be passed to the server in a cookie, and the serialization of that data must be
handled by the click tracking plugin/module - it is designed to work seamlessly
with parallel behavior implemented in Meetup Classic.

### Behavior

The platform currently adds `click` _and_ `change` listeners when creating the
Redux store for the browser - this is done on application setup and is
guaranteed not to run on the server. Each `click` and `change` event is sent
to `clickWriter`, which dispatches a Redux `CLICK_TRACK` action.

The click reducer is built into the platform reducer, and will store
click tracking data for the lifetime of the session, or until it is cleared with
a particular click 'clear' Redux action.

When the user navigates to a new page, the generated API request will read the
click tracking data from state, clear the click tracking state, and then set the
click tracking cookie. The cookie value will be sent with the API request, read
by the server, and then the server will force-clear the cookie.

### Leakage

Because click data only gets sent to the server when a user navigates to another
location within the application, there is a possibility of losing data when a
user navigates to another site, or even back to Meetup Classic, because a
'location change' action will not be dispatched and the Redux store will be
destroyed upon navigation.