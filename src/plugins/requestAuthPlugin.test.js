import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/catch';

import register, {
	getAuthenticate,
	oauthScheme,
	getRequestAuthorizer$,
	getAnonymousCode$,
	getAccessToken$,
	applyRequestAuthorizer$,
} from './requestAuthPlugin';


const MOCK_REPLY_FN = () => {};
MOCK_REPLY_FN.state = () => {};
MOCK_REPLY_FN.continue = () => {};

const MOCK_CODE = {
	grant_type: 'anonymous_code',
	token: 'mock_anon_code'
};

const MOCK_HEADERS = {};

const MOCK_OAUTH = {
	auth_url: 'http://example.com/auth_fakeout',
	access_url: 'http://example.com/access_fakeout',
	key: '1234',
	secret: 'asdf'
};

const MOCK_SERVER_APP = {
	env: 'development',
	api: {
		protocol: 'http',
		host: 'api.dev.meetup.com',
		timeout: 8000
	},
	asset_server: {
		host: '0.0.0.0',
		port: 8001
	},
	cookie_encrypt_secret: 'asdfasdfasdfasdfasdfasdfasdfasdfasdf',
	csrf_secret: 'asdfasdfasdfasdfasdfasdfasdfasdfasdf',
	dev_server: {
		host: '0.0.0.0',
		port: 8000
	},
	oauth: MOCK_OAUTH,
	photo_scaler_salt: 'asdfasdfasdfasdfasdfasdfasdfasdfasdf',
	duotone_urls: {
		foo: 'http://example.com'
	},
	isProd: 'false',
	isDev: 'true'
};

const MOCK_SERVER = {
	decorate() {},
	route() {},
	auth: {
		scheme: () => {},
	},
	ext: () => {},
	state: () => {},
	app: MOCK_SERVER_APP,
	expose: () => {},
	plugins: {
		requestAuth: {},
	}
};

const MOCK_REQUEST = {
	headers: MOCK_HEADERS,
	state: {},
	log: (tags, data) => { console.log(data); },
	authorize: () => Observable.of(MOCK_REQUEST),
	query: {},
	plugins: {
		requestAuth: {
			reply: MOCK_REPLY_FN
		},
	},
	server: MOCK_SERVER
};

const MOCK_AUTHED_REQUEST = {
	...MOCK_REQUEST,
	state: { oauth_token: 'good_token' },
	log: (tags, data) => { console.log(data); },
	authorize: () => Observable.of(MOCK_AUTHED_REQUEST),
};

const GOOD_MOCK_FETCH_RESULT = Promise.resolve({ text: () => Promise.resolve('{}') });
const BAD_MOCK_FETCH_RESULT = Promise.resolve({ text: () => Promise.resolve(undefined) });

describe('getAnonymousCode$', () => {
	it('sets MOCK_OAUTH.auth_url as opts.url', function(done) {
		// given the config, the mocked request function should return the auth url in code.url
		spyOn(global, 'fetch').and.callFake((url, opts) => {
			expect(url.startsWith(MOCK_OAUTH.auth_url)).toBe(true);
			return GOOD_MOCK_FETCH_RESULT;
		});

		getAnonymousCode$(MOCK_SERVER, null).subscribe(done);
	});

	it('throws error when response cannot be JSON parsed', function() {
		spyOn(global, 'fetch').and.callFake((url, opts) => BAD_MOCK_FETCH_RESULT);

		return getAnonymousCode$(MOCK_SERVER, null)
			.toPromise()
			.catch(err => {
				expect(err).toEqual(jasmine.any(Error));
			});
	});
});

describe('getAccessToken$', () => {
	it('sets MOCK_OAUTH.access_url as opts.url', function(done) {
		spyOn(global, 'fetch').and.callFake((url, opts) => {
			expect(url.startsWith(MOCK_OAUTH.access_url)).toBe(true);
			return GOOD_MOCK_FETCH_RESULT;
		});

		const getToken$ = getAccessToken$(MOCK_SERVER, null);
		getToken$(MOCK_HEADERS)(MOCK_CODE).subscribe(done);
	});

	it('throws an error when no oauth.key is supplied', function() {
		let serverNoOauthKey = { ...MOCK_SERVER };
		delete serverNoOauthKey.app.oauth.key;

		expect(() => getAccessToken$(serverNoOauthKey, null))
			.toThrowError(ReferenceError);
	});

	it('throws an error when no oauth.secret is supplied', function() {
		let serverNoOauthSecret = { ...MOCK_SERVER };
		delete serverNoOauthSecret.app.oauth.secret;

		expect(() => getAccessToken$(serverNoOauthSecret, null))
			.toThrowError(ReferenceError);
	});

	it('throws an error when no access code is supplied to the final curried function', function() {
		const token = null;
		const getToken$ = getAccessToken$(MOCK_SERVER, null);

		expect(() => getToken$(MOCK_HEADERS)({ ...MOCK_CODE, token })).toThrowError(ReferenceError);
	});

	it('throws an error when response cannot be JSON parsed', function(done) {
		spyOn(global, 'fetch').and.callFake((url, opts) => BAD_MOCK_FETCH_RESULT);
		const getToken$ = getAccessToken$(MOCK_SERVER, null);

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
			if (url.startsWith(MOCK_OAUTH.auth_url)) {
				return Promise.resolve({
					text: () => Promise.resolve('{ "code": 1234 }')
				});
			}
			if (url.startsWith(MOCK_OAUTH.access_url)) {
				return Promise.resolve({
					text: () => Promise.resolve('{ "oauth_token": "good_token" }')
				});
			}
		});
		const requestAuthorizer$ = getRequestAuthorizer$(MOCK_SERVER);

		requestAuthorizer$({ ...MOCK_REQUEST }).subscribe(auth => {
			expect(auth.oauth_token).toBe('good_token');
			done();
		});
	});
});

describe('applyRequestAuthorizer$', () => {
	const requestAuthorizer$ = getRequestAuthorizer$(MOCK_SERVER);
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
			server: { app: { isProd: false } },
		})
		.toPromise()
		.then(request => {
			expect(global.fetch).not.toHaveBeenCalled();
		});
	});

	it('calls fetch when provided a request without an oauth token in state', () => {
		spyOn(global, 'fetch').and.callFake((url, opts) => {
			if (url.startsWith(MOCK_OAUTH.auth_url)) {
				return Promise.resolve({
					text: () => Promise.resolve('{ "code": 1234 }')
				});
			}
			if (url.startsWith(MOCK_OAUTH.access_url)) {
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

	it('calls next', () => {
		spyOn(spyable, 'next');
		register(MOCK_SERVER, spyable.next);
		expect(spyable.next).toHaveBeenCalled();
	});
});

describe('oauthScheme', () => {
	it('calls server.ext with an \'onPreAuth\' function', () => {
		spyOn(MOCK_SERVER, 'ext');
		oauthScheme(MOCK_SERVER);
		expect(MOCK_SERVER.ext).toHaveBeenCalledWith('onPreAuth', jasmine.any(Function));
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
