[![npm version](https://badge.fury.io/js/mwp-core.svg)](https://badge.fury.io/js/mwp-core)
[![Build Status](https://travis-ci.org/meetup/meetup-web-platform.svg?branch=master)](https://travis-ci.org/meetup/meetup-web-platform)
[![Coverage Status](https://coveralls.io/repos/github/meetup/meetup-web-platform/badge.svg?branch=master)](https://coveralls.io/github/meetup/meetup-web-platform?branch=master)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)


# Web platform

This is the base platform for serving Meetup web apps including the public
website and admin. It provides a Hapi webserver and a set of conventions for
composing applications with React + Redux.

In general, application-specific code will live outside of this package.

## Public modules

- [Analytics/tracking](packages/mwp-tracking-plugin/README.md)
- [App configuration](packages/mwp-config/README.md)
- [Auth plugin](packages/mwp-auth-plugin/README.md)
- [Rendering in consumer applications](packages/mwp-app-render/README.md)
- [Routing module](packages/mwp-router/README.md)
- [Language plugin for Hapi](packages/mwp-language-plugin/README.md)
- [API proxy plugin for Hapi](packages/mwp-api-proxy-plugin/README.md)
- [Click and Activity tracking](packages/mwp-tracking-plugin/README.md)
- [API State module](packages/mwp-api-state/README.md)
  - ['Query': structuring data requests](packages/mwp-api-state/Queries.md) -
	  GET/POST/PATCH/PUT/DELETE requests to REST API
- [Redux store modules](packages/mwp-store/README.md) - browser and server
- [Security Policy headers](packages/mwp-csp-plugin/README.md)

# Releases

This package uses semver versioning to tag releases, although the patch version
is determined exclusively by the Travis build number for pushes to `master`.
Major and minor versions are hard-coded into the [Makefile](Makefile#L2).

Manual pushes to `master` and PR merges to master will be built by Travis, and
will kick off the yarn publish routine. The currently-published version of the
package is shown on the repo homepage on GitHub in a badge at the top of the
README.

## Development/Beta releases

When developing a consumer application that requires changes to the platform
code, you can release a beta version of the platform on npm by opening a PR in
the meetup-web-platform repo. When it builds successfully, a new beta version
will be added to the list of available npm versions. The generated version number
is in the Travis build logs, which you can navigate to by clicking on 'Show all
checks' in the box that says 'All checks have passed', and then getting the
'Details' of the Travis build.

<img width="797" alt="screen shot 2016-10-29 at 10 25 20 am" src="https://cloud.githubusercontent.com/assets/1885153/19822867/26d007dc-9dc2-11e6-8059-96d368411e78.png">

<img width="685" alt="screen shot 2016-10-29 at 10 25 29 am" src="https://cloud.githubusercontent.com/assets/1885153/19822869/28d1f432-9dc2-11e6-8157-3d381746f315.png">

At the bottom of the build log, there is a line that `echo`s the `GIT_TAG`.
If you click the disclosure arrow, the version number will be displayed, e.g.
`0.5.177-beta`.

<img width="343" alt="screen shot 2016-10-29 at 10 25 59 am" src="https://cloud.githubusercontent.com/assets/1885153/19822874/312a9792-9dc2-11e6-97bc-62f61d252d4e.png">

<img width="418" alt="screen shot 2016-10-29 at 10 26 06 am" src="https://cloud.githubusercontent.com/assets/1885153/19822876/34182e9c-9dc2-11e6-9901-c8e68591dc12.png">

You can then install this beta version into your consumer application with

```sh
> yarn install meetup-web-platform@<version tag>
```

Each time you push a change to your `meetup-web-platform` PR, you'll need to
re-install it with the new tag in your consumer application code.

The overall workflow is:

1. Open a PR for your `meetup-web-platform` branch
2. Wait for Travis to successfully build your branch (this can take 5+ minutes)
3. Get the version string from the build logs under `GIT_TAG`
4. (if needed) Push changes to your `meetup-web-platform` branch
5. Repeat steps 2-3

## Adding a new package

1. Create a new mwp-* directory in `/packages/`
2. Add a new `package.json` file in the new package
3. Add a line to `.travis.yml` `before_install` to create a `.npmrc` file that
   will enable NPM publishing
4. Increment the version number (a point release is usually okay since a new
   package is not a breaking change of existing packages)
5. Add a line to the `CHANGELOG.md`

If other MWP packages will depend on the new package, you'll need to first
publish the package without updating dependencies in other packages, and then
make a new release that updates the other packages with the new dependency - the
dependency must _exist_ in NPM before it can be specified as a dependency.
