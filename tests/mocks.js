import csrf from 'electrode-csrf-jwt/lib/csrf';
import uuid from 'uuid';

import makeRenderer from '../src/renderers/server-render';

import MockApp, {
	assetPublicPath,
	clientFilename,
	routes,
	reducer,
} from './MockApp.jsx';

const random32 = 'asdfasdfasdfasdfasdfasdfasdfasdf';
export const mockConfig = () => Promise.resolve({
	API_HOST: 'www.api.meetup.com',
	API_TIMEOUT: 10,
	OAUTH_ACCESS_URL: 'http://example.com/access',
	OAUTH_AUTH_URL: 'http://example.com/auth',
	CSRF_SECRET: random32,
	COOKIE_ENCRYPT_SECRET: random32,
	oauth: {
		key: random32,
		secret: random32,
	}
});

export const getMockFetch = (mockResponseValue=[{}], headers={}) =>
	Promise.resolve({
		text: () => Promise.resolve(JSON.stringify(mockResponseValue)),
		json: () => Promise.resolve(mockResponseValue),
		headers: {
			get: key => headers[key],
		},
	});

export function getCsrfHeaders() {
	const options = {
		secret:  'asdfasdfasdfasdfasdfasdfasdfasdf',
	};
	const id = uuid.v4();
	const headerPayload = {type: 'header', uuid: id};
	const cookiePayload = {type: 'cookie', uuid: id};

	return csrf.create(headerPayload, options)
		.then(headerToken => {
			return csrf.create(cookiePayload, options)
				.then(cookieToken => ([headerToken, cookieToken]));
		});
}

export const getMockRenderRequestMap = () => {
	const basename = '/';

	const renderRequest$ = makeRenderer(
		MockApp,
		routes,
		reducer,
		clientFilename,
		assetPublicPath,
		[],
		basename
	);

	return {
		'en-US': renderRequest$,
	};
};

