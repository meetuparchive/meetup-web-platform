import { Observable } from 'rxjs';
import register, {
	getAuthenticate,
	oauthScheme,
	getRequestAuthorizer$,
	getAnonymousCode$,
	getAccessToken$,
	applyRequestAuthorizer$,
} from './requestAuthPlugin';

const oauth = {
	key: '1234',
	secret: 'asdf',
};
const MOCK_SERVER = {
	decorate() {},
	route() {},
	auth: {
		scheme: () => {},
	},
	ext: () => {},
	state: () => {},
	app: {},
	expose: () => {},
	plugins: { requestAuth: { config: { COOKIE_ENCRYPT_SECRET: 'asdfasdfasdfasdfasdfasdfasdfasdfasdf' } } }
};
const MOCK_HEADERS = {};
const MOCK_REPLY_FN = () => {};
MOCK_REPLY_FN.state = () => {};
MOCK_REPLY_FN.continue = () => {};
const MOCK_REQUEST = {
	headers: MOCK_HEADERS,
	state: {},
	log: (tags, data) => { console.log(data); },
	authorize: () => Observable.of(MOCK_REQUEST),
	query: {},
	plugins: {
		requestAuth: {},
	},
	server: {
		app: {},
	},
};
MOCK_REQUEST.plugins.requestAuth = {
	reply: MOCK_REPLY_FN
};

const MOCK_AUTHED_REQUEST = {
	...MOCK_REQUEST,
	state: { oauth_token: 'good_token' },
	log: (tags, data) => { console.log(data); },
	authorize: () => Observable.of(MOCK_AUTHED_REQUEST),
};

const GOOD_MOCK_FETCH_RESULT = Promise.resolve({
	text: () => Promise.resolve('{}')
});
const BAD_MOCK_FETCH_RESULT = Promise.resolve({ text: () => Promise.resolve(undefined) });

const OAUTH_AUTH_URL = 'http://example.com/auth_fakeout';
const OAUTH_ACCESS_URL = 'http://example.com/access_fakeout';
const MOCK_CODE = { grant_type: 'anonymous_code', token: 'mock_anon_code' };

describe('getAnonymousCode$', () => {
	it('sets OAUTH_AUTH_URL as opts.url', function(done) {
		// given the config, the mocked request function should return the auth url in code.url
		spyOn(global, 'fetch').and.callFake((url, opts) => {
			expect(url.startsWith(OAUTH_AUTH_URL)).toBe(true);
			return GOOD_MOCK_FETCH_RESULT;
		});
		getAnonymousCode$({ oauth, OAUTH_AUTH_URL }).subscribe(done);
	});
	it('throws error when response cannot be JSON parsed', function() {
		spyOn(global, 'fetch').and.callFake((url, opts) => BAD_MOCK_FETCH_RESULT);

		return getAnonymousCode$({ oauth, OAUTH_AUTH_URL })
			.toPromise()
			.catch(err => {
				expect(err).toEqual(jasmine.any(Error));
			});
	});

});

describe('getAccessToken$', () => {
	it('sets OAUTH_ACCESS_URL as opts.url', function(done) {
		spyOn(global, 'fetch').and.callFake((url, opts) => {
			expect(url.startsWith(OAUTH_ACCESS_URL)).toBe(true);
			return GOOD_MOCK_FETCH_RESULT;
		});
		const getToken$ = getAccessToken$({ oauth, OAUTH_ACCESS_URL }, null);
		getToken$(MOCK_HEADERS)(MOCK_CODE).subscribe(done);
	});
	it('throws an error when no oauth.key is supplied', function() {
		const oauthNoKey = { ...oauth };
		delete oauthNoKey.key;
		expect(() => getAccessToken$({ oauth: oauthNoKey, OAUTH_ACCESS_URL }, null))
			.toThrowError(ReferenceError);
	});
	it('throws an error when no oauth.secret is supplied', function() {
		const oauthNoSecret = { ...oauth };
		delete oauthNoSecret.secret;
		expect(() => getAccessToken$({ oauth: oauthNoSecret, OAUTH_ACCESS_URL }, null))
			.toThrowError(ReferenceError);
	});
	it('throws an error when no access code is supplied to the final curried function', function() {
		const token = null;
		const getToken$ = getAccessToken$({ oauth, OAUTH_ACCESS_URL }, null);
		expect(() => getToken$(MOCK_HEADERS)({ ...MOCK_CODE, token })).toThrowError(ReferenceError);
	});
	it('throws an error when response cannot be JSON parsed', function(done) {
		spyOn(global, 'fetch').and.callFake((url, opts) => BAD_MOCK_FETCH_RESULT);
		const getToken$ = getAccessToken$({ oauth, OAUTH_ACCESS_URL }, null);
		getToken$(MOCK_HEADERS)(MOCK_CODE)
			.catch(err => {
				expect(err).toEqual(jasmine.any(Error));
				return Observable.of(null);
			})
			.subscribe(done);
	});
});

describe('getRequestAuthorizer$', () => {
	it('returns token when provided URLs and oauth info', function(done) {
		spyOn(global, 'fetch').and.callFake((url, opts) => {
			if (url.startsWith(OAUTH_AUTH_URL)) {
				return Promise.resolve({
					text: () => Promise.resolve('{ "code": 1234 }')
				});
			}
			if (url.startsWith(OAUTH_ACCESS_URL)) {
				return Promise.resolve({
					text: () => Promise.resolve('{ "oauth_token": "good_token" }')
				});
			}
		});
		const requestAuthorizer$ = getRequestAuthorizer$({ oauth, OAUTH_AUTH_URL, OAUTH_ACCESS_URL }, null);

		requestAuthorizer$({ ...MOCK_REQUEST }).subscribe(auth => {
			expect(auth.oauth_token).toBe('good_token');
			done();
		});
	});
});
describe('applyRequestAuthorizer$', () => {
	const requestAuthorizer$ = getRequestAuthorizer$({ oauth, OAUTH_AUTH_URL, OAUTH_ACCESS_URL }, null);
	const authorizeRequest$ = applyRequestAuthorizer$(requestAuthorizer$);
	it('does not try to fetch when provided a request with oauth_token in state', () => {
		spyOn(global, 'fetch');

		return authorizeRequest$({
			...MOCK_REQUEST,
			state: {
				oauth_token: 'foo',
			}
		})
		.toPromise()
		.then(request => {
			expect(global.fetch).not.toHaveBeenCalled();
		});
	});
	it('does not try to fetch when provided a request with MEETUP_MEMBER in state', () => {
		spyOn(global, 'fetch');

		return authorizeRequest$({
			...MOCK_REQUEST,
			state: {
				MEETUP_MEMBER: 'foo',
			}
		})
		.toPromise()
		.then(request => {
			expect(global.fetch).not.toHaveBeenCalled();
		});
	});
	it('does not try to fetch when provided a request with MEETUP_MEMBER_DEV in state', () => {
		spyOn(global, 'fetch');

		return authorizeRequest$({
			...MOCK_AUTHED_REQUEST,
			state: {
				MEETUP_MEMBER_DEV: 'foo',
			},
			server: { app: { isDevConfig: true } },
		})
		.toPromise()
		.then(request => {
			expect(global.fetch).not.toHaveBeenCalled();
		});
	});
	it('calls fetch when provided a request without an oauth token in state', () => {
		spyOn(global, 'fetch').and.callFake((url, opts) => {
			if (url.startsWith(OAUTH_AUTH_URL)) {
				return Promise.resolve({
					text: () => Promise.resolve('{ "code": 1234 }')
				});
			}
			if (url.startsWith(OAUTH_ACCESS_URL)) {
				return Promise.resolve({
					text: () => Promise.resolve('{ "oauth_token": "good_token" }')
				});
			}
		});
		return authorizeRequest$({ ...MOCK_REQUEST })
			.toPromise()
			.then(request => {
				expect(global.fetch).toHaveBeenCalled();
			});
	});
});
describe('register', () => {
	const spyable = {
		next() {}
	};
	const app = {
		OAUTH_AUTH_URL: '',
		OAUTH_ACCESS_URL: '',
		oauth: {
			key: '1234',
			secret: 'abcd',
		},
	};
	it('calls next', () => {
		spyOn(spyable, 'next');
		register({
			...MOCK_SERVER,
			app
		}, {}, spyable.next);
		expect(spyable.next).toHaveBeenCalled();
	});
});

describe('oauthScheme', () => {
	const config = {
		OAUTH_AUTH_URL,
		OAUTH_ACCESS_URL,
		oauth: {
			key: '1234',
			secret: 'abcd',
		},
		COOKIE_ENCRYPT_SECRET: 'asdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdf',
		duotoneUrls: { foo: 'http://example.com' },
	};
	const plugins = { requestAuth: { config } };
	it('calls server.ext with an \'onPreAuth\' function', () => {
		const server = {
			...MOCK_SERVER,
			plugins
		};
		spyOn(server, 'ext');
		oauthScheme(server);
		expect(server.ext).toHaveBeenCalledWith('onPreAuth', jasmine.any(Function));
	});
});

describe('getAuthenticate', () => {
	it('calls request.authorize', () => {
		const spyable = {
			authorizeRequest$: x => Observable.of(x),
		};
		spyOn(spyable, 'authorizeRequest$').and.callThrough();
		return new Promise((resolve, reject) =>
			getAuthenticate(spyable.authorizeRequest$)(MOCK_REQUEST, MOCK_REPLY_FN)
				.add(() => {
					expect(spyable.authorizeRequest$).toHaveBeenCalled();
					resolve();
				})
		);
	});
	it('calls reply.continue with credentials and artifacts', () => {
		spyOn(MOCK_REPLY_FN, 'continue');
		const request = {
			...MOCK_AUTHED_REQUEST,
			plugins: { requestAuth: { authType: 'oauth_token' } }
		};
		return new Promise((resolve, reject) =>
			getAuthenticate(x => Observable.of(x))(request, MOCK_REPLY_FN)
				.add(() => {
					expect(MOCK_REPLY_FN.continue)
						.toHaveBeenCalledWith({
							credentials: jasmine.any(String),
							artifacts: jasmine.any(String)
						});
					resolve();
				})
		);
	});
	it('calls reply(err...) when auth throws an error', () => {
		const theError = new Error('badness');
		const authorizeRequest$ = x => Observable.throw(theError);
		const spyable = { MOCK_REPLY_FN };
		spyOn(spyable, 'MOCK_REPLY_FN');
		return new Promise((resolve, reject) =>
			getAuthenticate(authorizeRequest$)(
				{ ...MOCK_AUTHED_REQUEST },
				spyable.MOCK_REPLY_FN
			).add(() => {
				expect(spyable.MOCK_REPLY_FN)
					.toHaveBeenCalledWith(theError, null, jasmine.any(Object));
				resolve();
			})
		);
	});
});
