# App configuration

The platform code uses [node-convict](https://github.com/mozilla/node-convict)
for configuration management. The platform will automatically provide a base set
of dev-friendly defaults for all non-secret values.

All default values can be overwritten via a local config file or environment
vars. **Using a config file is preferred** in order to not interfere with other
apps running in the same environment.

## Configuration precedence

Configuration values are read in the following order of increasing precedence:

1. Default value - see `src/util/config/index.js` and `src/util/config/build.js`
2. Application root `config.<NODE_ENV>.json` file
3. Environment variable in `$HOME/.mupweb.config`

**Note** that if a configuration variable is set in _BOTH_ a local config file AND
in an environment var, the environment variable will take precedence.

## Config file API

Config files should be placed in the **root of the application repo**, and be named
with the format `config.<target NODE_ENV>.json`, e.g.

- `config.test.json` (can be committed - should not contain secrets)
- `config.development.json` (must be `.gitignore`d)
- `config.production.json` (must be `.gitignore`d)

The schema for all supported values can be found in `src/util/config/index.js`
and `src/util/config/build.js`.


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
    "host": "beta2.dev.meetup.com",
  },
  "csrf_secret": "asdfasdfasdfasdfasdfasdfasdfasdf",
  "cookie_encrypt_secret": "asdfasdfasdfasdfasdfasdfasdfasdf",
  "app_server": {
    "host": "beta2.dev.meetup.com",
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

### Running over HTTPS

By default, the app server and asset server will run over HTTPS, but you must
supply the cert files (`.key` and `.crt`). The platform will look for these
files in `~/.certs/` and warn you if they are not found, although you can supply
a custom file path if desired.

To get the cert files, you can copy them from the chapstick repo at
`/util/conf/localdev/ssl/`. You should copy the
`star.dev.meetup.com.crt` and `star.dev.meetup.com.key` files to `~/certs/` on
your dev machine.

**Important** DO NOT copy the files into the mup-web repo - they should not be
checked into version control

```
$ mkdir ~/.certs # if it doesn't exist
$ scp www.dev.meetup.com:/usr/local/meetup/util/conf/localdev/ssl/star.dev.meetup.com.* ~/.certs/
```

if that fails, you may need to specify your username in the `scp` command -
```
$ scp username@www.dev.meetup.com:/usr/local/meetup/util/conf/localdev/ssl/star.dev.meetup.com.* ~/.certs/
```

If you want to keep the cert files elsewhere, you will need to create/update
your `config.development.json` to tell the platform where to find them

```json
{
  "asset_server": {
    "crt_file":"/path/to/certificate.crt",
    "key_file":"/path/to/certificate.key"
  },
  "app_server": {
    "crt_file":"/path/to/certificate.crt",
    "key_file":"/path/to/certificate.key"
  }
}
```

The current certs are valid until April 2019 and are issued by a Certificate
Authority (GeoTrust), so you shouldn't have to ignore SSL warnings about self-
signed certificates.
