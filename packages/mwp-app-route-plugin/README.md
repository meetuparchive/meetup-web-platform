# mwp-app-route-plugin
This plugin is mainly concerned with 2 things.

1. Rendering a route with the appropriate language.
2. Fetching runtime flags from Launch Darkly.

#### Note:
In order to properly access your LaunchDarkly flags the secret must exist within AWS Secrets Manager.

The Secret Name should be `LaunchDarkly` It should contain a key `apiAccessToken` with the value of the LD api key.
