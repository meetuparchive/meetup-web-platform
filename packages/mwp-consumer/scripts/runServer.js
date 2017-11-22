const runServer = require('./app-server');
const app = require('../build/server-app').default;

runServer({ 'en-US': app });
