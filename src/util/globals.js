import fetch from 'node-fetch';

import config from './config';

// hello polyfills
global.URL = require('url').URL;
global.fetch = fetch;

// runtime values needed by browser and server
global.CONFIG = {
	ASSET_SERVER_HOST : config.get('asset_server.host'),
	ASSET_SERVER_PORT : config.get('asset_server.port'),
};

