# App configuration

The platform code uses [node-convict](https://github.com/mozilla/node-convict)
for configuration management. The platform will automatically provide a base set
of dev-friendly defaults for all non-secret values.

All default values can be overwritten via a local config file or environment
vars. **Using a config file is preferred** in order to not interfere with other
apps running in the same environment.

## Configuration precedence

Configuration values are read in the following order of increasing precedence:

1. Default value - defined in [`../src/util/config.js`](../src/util/config.js)
2. Application root `config.<NODE_ENV>.json` file
3. Environment variable in `$HOME/.mupweb.config`
4. Command line arguments

**Note** that if a configuration variable is set in _BOTH_ a local config file AND
in an environment var, the environment variable will take precedence.

## Config file API

Config files should be placed in the **root of the application repo**, and be named
with the format `config.<target NODE_ENV>.json`, e.g.

- `config.test.json` (can be committed - should not contain secrets)
- `config.development.json` (must be `.gitignore`d)
- `config.production.json` (must be `.gitignore`d)

The schema for all supported values is in `../src/util/config.js`.


## Examples

### Sample `config.test.json` file

This example local config file can be found in
[`config.test.json`](../config.test.json) and is used to set config values
for unit test.

The secrets in this example are dummy values and won't work in an actual app.

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
