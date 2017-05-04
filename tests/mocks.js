import csrf from 'electrode-csrf-jwt/lib/csrf';
import uuid from 'uuid';

import makeRenderer from '../src/renderers/server-render';

import { assetPublicPath, clientFilename, routes, reducer } from './mockApp';

const isProd = process.env.NODE_ENV === 'production';
const isDev = !isProd;

const random32 = 'asdfasdfasdfasdfasdfasdfasdfasdf';
export const mockConfig = {
	api: {
		protocol: 'https',
		host: 'www.api.meetup.com',
		timeout: 10,
		root_url: 'https://www.api.meetup.com',
	},
	csrf_secret: random32,
	cookie_encrypt_secret: random32,
	dev_server: {
		host: 'www.api.meetup.com',
	},
	duotone_urls: ['http://example.com/duotone.jpg'],
	isDev,
	isProd,
	oauth: {
		auth_url: 'https://secure.dev.meetup.com/oauth2/authorize',
		access_url: 'https://secure.dev.meetup.com/oauth2/access',
		key: random32,
		secret: random32,
	},
};

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
		secret: 'asdfasdfasdfasdfasdfasdfasdfasdf',
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
		clientFilename,
		assetPublicPath,
		[],
		basename
	);

	return {
		'en-US': renderRequest$,
	};
};
