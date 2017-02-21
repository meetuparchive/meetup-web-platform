import Joi from 'joi';
import {
	applyAuthState,
	setPluginState,
	configureAuthState,
	configureAuthCookies,
	removeAuthState,
} from './authUtils';

describe('configureAuthCookies', () => {
	const serverWithState = {
		state: () => {},
		app: {},
	};
	it('calls server.state for each auth cookie name', () => {
		const app = {
			COOKIE_ENCRYPT_SECRET: 'asdklfjahsdflkjasdfhlkajsdfkljasdlkasdjhfalksdjfbalkjsdhfalsdfasdlkfasd',
		};
		spyOn(serverWithState, 'state');
		configureAuthCookies({
			...serverWithState,
			app,
		});
		const callArgs = serverWithState.state.calls.allArgs();
		expect(callArgs.length).toBeGreaterThan(0);
		callArgs.forEach(args => {
			expect(args[0]).toEqual(jasmine.any(String));  // the cookie name, e.g. 'oauth_token'
			expect(args[1]).toEqual(jasmine.any(Object));  // the cookie config
		});
	});
	it('throws an error when secret is missing', () => {
		const app = {};
		expect(() => configureAuthCookies({
			...serverWithState,
			app,
		})).toThrow();
	});
	it('throws an error when secret is too short', () => {
		const app = {
			COOKIE_ENCRYPT_SECRET: 'less than 32 characters',
		};
		expect(() => configureAuthCookies({
			...serverWithState,
			app,
		})).toThrow();
	});
});

describe('applyAuthState', () => {
	it('calls reply.state and sets request.state for each auth cookie name', () => {
		const reply = {
			state() {},
		};
		const request = {
			log() {},
			state: {},
		};
		spyOn(reply, 'state');
		const testApply = applyAuthState(request, reply);
		const auth = {
			oauth_token: '1234',
			refresh_token: '2345',
		};
		testApply(auth);
		reply.state.calls.allArgs().forEach(args => {
			expect(args[0] in auth).toBe(true);
			expect(args[1]).toEqual(auth[args[0]]);
		});
		expect(request.state).toEqual({
			__internal_oauth_token: auth.oauth_token,
			__internal_refresh_token: auth.refresh_token,
		});
	});
});

describe('setPluginState', () => {
	const reply = {
		continue: () => {},
	};
	it('calls reply.continue', () => {
		// SIDE EFFECT - function call will modify request
		const request = {
			plugins: {},
		};
		spyOn(reply, 'continue');
		setPluginState(request, reply);
		expect(reply.continue).toHaveBeenCalled();
	});
	it('assigns the reply as a property of the request', () => {
		// SIDE EFFECT - function call will modify request
		const request = {
			plugins: {},
		};
		setPluginState(request, reply);
		expect(request.plugins.requestAuth.reply).toBe(reply);
	});
});

describe('removeAuthState', () => {
	it('calls reply.unstate and sets request.state to null for each auth cookie name', () => {
		const reply = {
			unstate() {},
		};
		const request = {
			log() {},
			state: {
				a: 'b',
				c: 'd',
				foo: 'bar',
			},
		};
		spyOn(reply, 'unstate');
		removeAuthState(Object.keys(request.state), request, reply);
		expect(reply.unstate.calls.allArgs().map(args => args[0]).sort())
			.toEqual(Object.keys(request.state).sort());
		expect(
			Object.keys(request.state)
				.map(k => request.state[k])
				.every(v => v === null)
		).toBe(true);
	});
});

describe('configureAuthState', () => {
	it('returns an object with oauth_token and refresh_token keys', () => {
		const cookieSchema = Joi.object({
			value: Joi.string().allow(''),
			opts: {
				ttl: Joi.number().integer(),
			}
		});
		const authStateSchema = Joi.object({
			oauth_token: cookieSchema,
			refresh_token: cookieSchema,
		});
		const emptyAuthState = configureAuthState({});
		expect(Joi.validate(emptyAuthState, authStateSchema).error).toBeNull();
	});
	it('returns value from oauth_token or access_token', () => {
		const oauthAuth = {
			oauth_token: '1234',
		};
		const accessAuth = {
			oauth_token: '1234',
		};
		expect(configureAuthState(oauthAuth).oauth_token.value)
			.toEqual(oauthAuth.oauth_token);
		expect(configureAuthState(accessAuth).oauth_token.value)
			.toEqual(accessAuth.oauth_token);
	});
	it('sets ttl to 1000 x expires_in', () => {
		const oauthAuth = {
			oauth_token: '1234',
			expires_in: 49302,
		};
		expect(configureAuthState(oauthAuth).oauth_token.opts.ttl)
			.toEqual(oauthAuth.expires_in * 1000);
	});
});

