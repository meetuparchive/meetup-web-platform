// @flow
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import getHandler from './handler';

export const onPreResponse = {
	/*
	 * This function processes the route response before it is sent to the client.
	 *
	 * - In dev, it transforms the generic 500 error response JSON into a full dev-
	 *   friendly rendering of the stack trace.
	 */
	method: (request: HapiRequest, h: HapiResponseToolkit) => {
		const response = request.response;

		if (!response.isBoom || process.env.NODE_ENV === 'production') {
			return h.continue;
		}
		const error = response;
		const { RedBoxError } = require('redbox-react');
		const errorMarkup = ReactDOMServer.renderToString(
			React.createElement(RedBoxError, { error })
		);
		const errorResponse = h.response(
			`<!DOCTYPE html><html><body>${errorMarkup}</body></html>`
		);
		errorResponse.code(error.output.statusCode);
		return errorResponse;
	},
};

/*
 * Wildcard route for all application GET requests - see the 'handler' module
 * for rendering details
 *
 * Route options:
 *
 * - `onPreResponse`: process the response before it is sent to client
 * - `state`: skip cookie validation because cookies can be set by other services
 *   on the same domain and may not conform to the validation rules that are
 *   used by Hapi
 */
export default (languageRenderers: { [string]: LanguageRenderer }) => ({
	method: 'GET',
	path: '/{wild*}',
	options: {
		ext: {
			onPreResponse,
		},
		plugins: {
			'electrode-csrf-jwt': {
				enabled: true, // need to generate tokens on page request
			},
		},
		state: {
			failAction: 'ignore', // ignore cookie validation, just accept
		},
	},
	handler: getHandler(languageRenderers),
});
