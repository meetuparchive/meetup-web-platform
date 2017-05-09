# Tracking

The platform currently supports two types of analytics tracking:

1. Activity - navigation
2. Click - all clicks on the site

## Logging

The tracking logs are Avro-encoded and serialized to JSON according to the
[Analytics
Logging](https://meetup.atlassian.net/wiki/display/MUP/Analytics+Logging) spec.

In the Google Container Engine deployment, the tracking logs are written
directly to `process.stdout`.

In Google App Engine, we use [Google
Pub/Sub](https://googlecloudplatform.github.io/google-cloud-node/#/docs/pubsub/0.9.0/pubsub/topic?method=Topic)
to publish tracking data to a pre-defined 'topic'.

### Google App Engine Pub/Sub

The Pub/Sub configuration will only activate when the `GAE_INSTANCE` environment
variable is set. In addition, the environment must be configured to
automatically authenticate with Google Cloud.

In production, Pub/Sub authentication is handled automatically by the runtime
environment. In development, you will need to use the `gcloud SDK` to configure
your environment with the following command:

```
$ gcloud auth application-default login
```

Once set up, you can run the application in 'GAE' mode with

```
$ GAE_INSTANCE=foo yarn start
```

or an equivalent startup command. Tracking data from this dev instance should
then be consumed by an analytics back end.

