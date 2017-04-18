import React from 'react';
import ReactDOMServer from 'react-dom/server';

import config from '../util/config';
import { getAppRouteHandler } from './appRouteHandler';

export const onPreResponse = {
	/**
	 * This function processes the route response before it is sent to the client.
	 *
	 * - In dev, it transforms the generic 500 error response JSON into a full dev-
	 *   friendly rendering of the stack trace.
	 *
	 * @param {Object} request the Hapi request, _after_ a response has been
	 *   generated
	 * @param {Function} reply the Hapi reply interface
	 * @return {Object} a Hapi response
	 */
	method: (request, reply) => {
		const response = request.response;
		if (!response.isBoom || config.get('env') === 'production') {
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
 * Wildcard route for all application GET requests
 *
 * Route config:
 *
 * - `onPreResponse`: process the response before it is sent to client
 * - `state`: skip cookie validation because cookies can be set by other services
 *   on the same domain and may not conform to the validation rules that are
 *   used by Hapi
 *
 * @param {Object} renderRequestMap a map of 'localeCode' strings to request-
 *   rendering functions that return an HTML string
 * @return {Object} a Hapi route configuration object
 */
const getApplicationRoute = renderRequestMap => ({
	method: 'GET',
	path: '/{wild*}',
	config: {
		ext: {
			onPreResponse,
		},
		plugins: {
			'electrode-csrf-jwt': {
				enabled: true,  // need to generate tokens on page request
			}
		},
		state: {
			failAction: 'ignore',  // ignore cookie validation, just accept
		}
	},
	handler: getAppRouteHandler(renderRequestMap),
});

export default getApplicationRoute;

