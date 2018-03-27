import csrf from 'electrode-csrf-jwt/lib/csrf';
import uuid from 'uuid';

import config from 'mwp-config';
import makeRenderer from 'mwp-core/lib/server-render';
const appConfig = config.getServer().properties;

import { clientFilename, routes, reducer } from 'mwp-test-utils/lib/mockApp';

export const getMockFetch = (mockResponseValue = { responses: [{}] }, headers = {}) =>
	Promise.resolve({
		text: () => Promise.resolve(JSON.stringify(mockResponseValue)),
		json: () => Promise.resolve(mockResponseValue),
		headers: {
			get: key => headers[key],
		},
	});

export function getCsrfHeaders() {
	const options = {
		secret: appConfig.csrf_secret,
	};
	const id = uuid.v4();
	const headerPayload = { type: 'header', uuid: id };
	const cookiePayload = { type: 'cookie', uuid: id };

	return csrf.create(headerPayload, options).then(headerToken => {
		return csrf
			.create(cookiePayload, options)
			.then(cookieToken => [headerToken, cookieToken]);
	});
}

export const getMockRenderRequestMap = () => {
	const basename = '';

	const renderRequest$ = makeRenderer(routes, reducer, [], basename, [
		clientFilename,
	]);

	return {
		'en-US': renderRequest$,
	};
};
