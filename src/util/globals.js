import fetch from 'node-fetch';

// hello polyfills
global.URL = require('url').URL;
global.fetch = fetch;
