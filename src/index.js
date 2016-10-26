// IMPORTANT: only export server-side modules here - browser
// should only import modules individually
import makeServerRenderer from './renderers/server-render';
import startServer from './server';
import * as apiMocks from './util/mocks/api';
import * as appMocks from './util/mocks/app';

module.exports = {
	makeServerRenderer,
	startServer,
	mocks: {
		app: appMocks,
		api: apiMocks,
	}
};

