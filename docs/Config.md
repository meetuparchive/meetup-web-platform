# App configuration

The platform code uses [node-convict](https://github.com/mozilla/node-convict)
for configuration management. By default, the platform will automatically
provide a base set of dev-friendly defaults for all non-secret values.

All config values can be set by a local config file and/or environment vars.
Local config is preferred in order to not interfere with other apps running in
the same environment.

An example local config file can be found in
[`config.test.json`](../config.test.json) - this is the file used to set env
values for unit tests. The 'secret' values are dummy values that will not work
for actual development, so you will need to provide the real values in a config
file.

1. The OAuth consumer `key` for the platform
2. The OAuth consumer `secret`
3. The photo scaler salt for Meetup Classic

## Config file API

Config files should be placed in the root of the application repo, and be named
with the format `config.<target NODE_ENV>.json`, e.g.

- `config.test.json` (can be committed - should not contain secrets)
- `config.development.json` (must be `.gitignore`d)
- `config.production.json` (must be `.gitignore`d)

The schema for all supported values is in `../src/util/config.js`. 

### Example

```json
{
  "api": {
    "protocol": "https",
    "host": "www.api.dev.meetup.com",
    "timeout": 10,
    "root_url": "https://www.api.dev.meetup.com"
  },
  "asset_server": {
    "protocol": "http",
    "host": "beta2.dev.meetup.com",
    "port": 0
  },
  "csrf_secret": "asdfasdfasdfasdfasdfasdfasdfasdf",
  "cookie_encrypt_secret": "asdfasdfasdfasdfasdfasdfasdfasdf",
  "app_server": {
    "protocol": "http",
    "host": "beta2.dev.meetup.com",
    "port": 0
  },
  "disable_hmr": false,
  "duotone_urls": [
    "http://example.com/duotone.jpg"
  ],
  "photo_scaler_salt": "asdfasdfasdfasdfasdfasdfasdfasdf",
  "oauth": {
    "auth_url": "https://secure.dev.meetup.com/oauth2/authorize",
    "access_url": "https://secure.dev.meetup.com/oauth2/access",
    "key": "asdfasdfasdfasdfasdfasdfasdfasdf",
    "secret": "asdfasdfasdfasdfasdfasdfasdfasdf"
  }
}
```

