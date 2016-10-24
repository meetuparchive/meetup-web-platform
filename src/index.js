import makeServerRender from './renderers/server-render';
import makeBrowserRender from './renderers/browser-render';
import startServer from './renderers/browser-render';
import * as apiMocks from './util/mocks/api';
import * as appMocks from './util/mocks/app';

module.exports = {
	makeServerRender,
	makeBrowserRender,
	startServer,
	mocks: {
		app: appMocks,
		api: apiMocks,
	}
};

