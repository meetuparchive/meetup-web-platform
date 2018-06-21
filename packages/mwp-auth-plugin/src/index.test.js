import { mwpScheme } from './';

const MEMBER_COOKIE = 'MEETUP_MEMBER_DEV';
const CSRF_TOKEN_COOKIE = 'MEETUP_CSRF_DEV';
const MOCK_REPLY_FN = () => {};
MOCK_REPLY_FN.continue = jest.fn();

const MOCK_SERVER = {
	decorate() {},
	route() {},
	auth: {
		scheme: () => {},
	},
	ext: () => {},
	state: () => {},
	expose: () => {},
	plugins: {
		requestAuth: {},
	},
	settings: { app: { api: {} } },
};

const MOCK_REQUEST = {
	headers: {},
	state: {},
	query: {},
	server: MOCK_SERVER,
	raw: {
		req: {},
		res: {},
	},
};

describe('mwpScheme', () => {
	test('returns an object with an "authenticate" function', () => {
		expect(mwpScheme(MOCK_SERVER)).toMatchObject({
			authenticate: expect.any(Function),
		});
	});
	test('authenticate function calls h.continue with an object with a "credentials" value', () => {
		MOCK_REPLY_FN.continue.mockClear();
		mwpScheme(MOCK_SERVER).authenticate(MOCK_REQUEST, MOCK_REPLY_FN);
		expect(MOCK_REPLY_FN.continue).toHaveBeenCalledWith({
			credentials: {
				memberCookie: expect.any(String),
				csrfToken: expect.any(String),
			},
		});
	});
	test('returned credentials should match supplied cookie credentials', () => {
		MOCK_REPLY_FN.continue.mockClear();
		const memberCookie = 'foobar-member-cookie';
		const csrfToken = 'foobar-csrf-cookie';
		const MOCK_REQUEST_AUTH = {
			...MOCK_REQUEST,
			state: {
				...MOCK_REQUEST.state,
				[MEMBER_COOKIE]: memberCookie,
				[CSRF_TOKEN_COOKIE]: csrfToken,
			},
		};
		mwpScheme(MOCK_SERVER).authenticate(MOCK_REQUEST_AUTH, MOCK_REPLY_FN);
		expect(MOCK_REPLY_FN.continue).toHaveBeenCalledWith({
			credentials: {
				memberCookie,
				csrfToken,
			},
		});
	});
});
