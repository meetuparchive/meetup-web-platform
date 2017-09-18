import csrf from 'electrode-csrf-jwt/lib/csrf';
import uuid from 'uuid';

import appConfig from '../src/util/config';
import makeRenderer from '../src/renderers/server-render';

import { assetPublicPath, clientFilename, routes, reducer } from './mockApp';

export const getMockFetch = (
	mockResponseValue = { responses: [{}] },
	headers = {}
) =>
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

	const renderRequest$ = makeRenderer(
		routes,
		reducer,
		undefined,
		assetPublicPath,
		[],
		basename,
		[`${assetPublicPath}${clientFilename}`]
	);

	return {
		'en-US': renderRequest$,
	};
};
