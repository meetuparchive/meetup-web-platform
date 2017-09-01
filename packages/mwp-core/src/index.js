// IMPORTANT: only export server-side modules here - browser
// should only import modules individually
import makeServerRenderer from './renderers/server-render';
import { makeRenderer$ as makeServerRenderer$ } from './renderers/server-render';
import startServer from './server';

module.exports = {
	makeServerRenderer, // todo deprecate
	makeServerRenderer$,
	startServer,
};
