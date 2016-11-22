import { Observable } from 'rxjs';
import {
	MOCK_GROUP,
	MOCK_EVENT,
} from './api';

export const MOCK_APP_STATE = {
	app: {
		self: {
			type: 'member',
			value: {
				id: 1234,
				status: 'prereg',
			}
		},
		group: {
			type: 'group',
			value: MOCK_GROUP
		},
		events: {
			type: 'event',
			value: [
				{ ...MOCK_EVENT, ...({ id: 3456 }) },
				{ ...MOCK_EVENT, ...({ id: 4567 }) }
			]
		}
	},
	auth: {
		oauth_token: 'foo'
	},
	config: {},
	routing: {
		locationBeforeTransitions: {
			pathname: '/foo',
		}
	},
};

export const MOCK_ROUTES = [
	{
		path: '/noQuery',
		component: () => {},
	},
	{
		path: '/',
		component: () => {},
		query: () => {},
		childRoutes: [
			{
				path: 'foo',
				component: () => {},
				query: () => {}
			}
		]
	},
];

export const MOCK_API_PROBLEM = {
	problem: 'There was an internal problem in the API'
};

export const MOCK_API_RESULT = [{
	ref: 'group',
	type: 'group',
	value: MOCK_APP_STATE.app.group.value
}];

export const MOCK_OAUTH_COOKIES = {
	oauth_token: '1234',
	refresh_token: 'asdf',
	anonymous: true
};

export const MOCK_RENDERPROPS = {
	location: {  // https://github.com/reactjs/history/blob/master/docs/Location.md
		pathname: '/foo',
		search: '?foo',
		state: {},
		action: 'PUSH',
		key: '1234',
		query: {
			foo: null,
		},
	},
	params: {
		urlname: 'foo'
	}
};

export const MOCK_RENDERPROPS_UTF8 = {
	location: {  // https://github.com/reactjs/history/blob/master/docs/Location.md
		pathname: '/バ-京',
		search: '',
		state: {},
		action: 'PUSH',
		key: '1234'
	},
	params: {
		urlname: 'バ-京'
	}
};

export const MOCK_MEANINGLESS_ACTION = {
	type: 'ARBITRARY',
	payload: '/'
};

export const mockQuery = ({ location, params }) => {
	return {
		type: 'group',
		params: params,
		ref: 'group'
	};
};

export const mockQueryBadType = ({ location, params }) => {
	const type = 'lkajlhsdhljaskliub';
	return { ...mockQuery({ location, params }), type };
};

export const MOCK_AUTH_HEADER = `Bearer ${MOCK_OAUTH_COOKIES}.oauth_token`;
export const MOCK_DATETIME = new Date().getTime();
export const MOCK_CREDENTIALS = {
	username: 'Michael McGahan',
	pw: 'whatever'
};

export const MOCK_LOGIN_RESPONSE = {
	value: {
		member: {},
		oauth_token: 1234,
	}
};

export const MOCK_POST_ACTION = {
	type: 'POST_DUMMY',
	payload: {
		query: {},
		onSuccess: payload => ({ type: 'MOCK_SUCCESS', payload }),
		onError: err => ({ type: 'MOCK_ERROR', payload: err, error: true }),
	}
};

// string 'Cookie:' header from MOCK_OAUTH_COOKIES
export const MOCK_COOKIE_HEADER = Object.keys(MOCK_OAUTH_COOKIES)
	.reduce((acc, key) => acc += `${key}=${JSON.stringify(MOCK_OAUTH_COOKIES[key])}; `, '');

// mock the renderRequest$ function provided by the server-locale app bundle
export const MOCK_RENDER_REQUEST$ = () =>
	Observable.of({ result: MOCK_RENDER_RESULT, statusCode: 200 });

export const MOCK_renderRequestMap = {
	'en-US': MOCK_RENDER_REQUEST$,
};

// Arbitrary string response payload from server render
export const MOCK_RENDER_RESULT = '<html><body><h1>Hello world</h1></body></html>';

export const MOCK_REQUEST_COOKIES = {
	url: '/',
	headers: {
		cookie: MOCK_COOKIE_HEADER
	},
};

// mock the whole apiProxy module so that we don't actually invoke it
export const MOCK_API_PROXY$ = () => () => Observable.of(MOCK_API_RESULT);

const mock_valid_config = {
	DEV_SERVER_PORT: 8000,
	API_PROTOCOL: 'https',
	API_HOST: 'api.dev.meetup.com',
	OAUTH_AUTH_URL: 'https://secure.dev.meetup.com/oauth2/authorize',
	OAUTH_ACCESS_URL: 'https://secure.dev.meetup.com/oauth2/access',
	PHOTO_SCALER_SALT: 'abcdefg',
	AUTH_ENDPOINT: '/auth',
	oauth: {
		secret: process.env.MUPWEB_OAUTH_SECRET,
		key: process.env.MUPWEB_OAUTH_KEY,
	},
};
mock_valid_config.API_SERVER_ROOT_URL = `${mock_valid_config.API_PROTOCOL}://${mock_valid_config.API_HOST}`;
export const MOCK_VALID_CONFIG = mock_valid_config;


