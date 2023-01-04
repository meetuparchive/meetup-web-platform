# Config

This is the 'main' config for all Meetup Web Platform applications. It is
intended to consolidate both buildtime and runtime configuration properties and
rules, including Babel and Webpack configuration, Node server config, and
configuration needed to to interface with external services such as Travis CI
and Transifex.

By consolidating all of this configuration into a single module/package, all
downstream dependencies can explicitly opt-in to reading configuration values
that determine the behavior of the system.

**Important**: browser-run scripts should never directly import configuration
values. Instead, config should be read from the application state provided to
the client on initial render.

## General config

The root-level modules of the config package each organize some information that
is used by many different packages. For the most part, they describe the
application environment, e.g. standard file `paths`, `env` values, and `package`
config values.

## Babel config

All **Babel** plugins and presets are defined in the `/babel` module.

## Server config

The `/server` module defines the runtime configuration of the Node application
server. It is essentially an extension of the `/env` config, but adds a few more
host and authentication configuration values.

Server config code uses [node-convict](https://github.com/mozilla/node-convict)
for configuration management. The platform will automatically provide a base set
of dev-friendly defaults for all non-secret values.

All default values can be overwritten via a local config file or environment
vars. **Using a config file is preferred** in order to not interfere with other
apps running in the same environment.

### Configuration precedence

Configuration values are read in the following order of precedence:

1. Environment variable
2. Application root `config.<NODE_ENV>.json` file
3. Default value - see [`server/index.js`](server/index.js)

### Config file API

Config files should be placed in the **root of the application repo**, and be named
with the format `config.<target NODE_ENV>.json`, e.g.

- `config.test.json` (can be committed - should not contain secrets)
- `config.development.json` (must be `.gitignore`d)
- `config.production.json` (must be `.gitignore`d)

## `process.env` keys supported in client code

Although `process.env` is typically only available in server-side code, our
bundling process can automatically inject certain environment values into the
client bundle wherever it finds a supported `process.env.YOUR_ENV_VAR`
expression.

Supported environment variables are declared using the
`webpack.EnvironmentPlugin` in [`browserAppConfig`](webpack/browserAppConfig.js)
