import {
	// applyAuthState,
	configureServerState,
	// configureAuthState,
	// removeAuthState,
} from './authUtils';

describe('configureServerState', () => {
	const serverWithState = {
		state: () => {},
	};
	it('calls server.state for each auth cookie name', () => {
		const goodOptions = {
			COOKIE_ENCRYPT_SECRET: 'asdklfjahsdflkjasdfhlkajsdfkljasdlkasdjhfalksdjfbalkjsdhfalsdfasdlkfasd',
		};
		spyOn(serverWithState, 'state');
		configureServerState(serverWithState, goodOptions);
		const callArgs = serverWithState.state.calls.allArgs();
		expect(callArgs.length).toBeGreaterThan(0);
		callArgs.forEach(args => {
			expect(args[0]).toEqual(jasmine.any(String));
			expect(args[1]).toEqual(jasmine.any(Object));
		});
	});
	it('throws an error when secret is missing', () => {
		const missingSecretOpts = {};
		expect(() => configureServerState(serverWithState, missingSecretOpts)).toThrow();
	});
	it('throws an error when secret is too short', () => {
		const shortSecretOpts = {
			COOKIE_ENCRYPT_SECRET: 'less than 32 characters',
		};
		expect(() => configureServerState(serverWithState, shortSecretOpts)).toThrow();
	});
});

