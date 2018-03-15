import { makeRenderer$ as makeServerRenderer$ } from 'mwp-core/lib/renderers/server-render';
import makeRootReducer from 'mwp-store/lib/reducer';

import routes from './app/routes';

// the server-side `renderRequest$` Observable will take care of wrapping
// the react application with the full HTML response markup, including `<html>`,
// `<head>` and its contents, and the `<script>` tag required to load the app
// in the browser
const renderRequest = makeServerRenderer$({
	routes,
	reducer: makeRootReducer(),
	scripts: ['/app.js'], // don't care about serving scripts to browser, but have to specify something
	baseUrl: '',
	enableServiceWorker: false, // don't care
	cssLinks: [], // don't care
});

export default renderRequest;
