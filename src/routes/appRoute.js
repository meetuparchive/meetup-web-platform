import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { getAppRouteHandler } from './appRouteHandler';

/**
 * This function provides global error handling when there is a 500 error
 */
export const onPreResponse = {
	method: (request, reply) => {
		const response = request.response;
		if (!response.isBoom) {
			return reply.continue();
		}
		const error = response;
		const { RedBoxError } = require('redbox-react');
		const errorMarkup = ReactDOMServer.renderToString(
			React.createElement(RedBoxError, { error })
		);
		const errorResponse = reply(`<!DOCTYPE html><html><body>${errorMarkup}</body></html>`);
		errorResponse.code(error.output.statusCode);
		return errorResponse;
	},
};

/**
 * Only one wildcard route for all application GET requests - exceptions are
 * described in the routes above
 */
const getApplicationRoute = renderRequestMap => ({
	method: 'GET',
	path: '/{wild*}',
	config: {
		ext: {
			onPreResponse,
		},
	},
	handler: getAppRouteHandler(renderRequestMap),
});

export default getApplicationRoute;

