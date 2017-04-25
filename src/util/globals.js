import fetch from 'node-fetch';

// hello polyfills
global.URL = require('url').URL;
global.fetch = fetch;

// runtime values needed by browser and server
global.CONFIG = {
	ASSET_SERVER_HOST : process.env.ASSET_SERVER_HOST,
	ASSET_SERVER_PORT : process.env.ASSET_SERVER_PORT,
};

