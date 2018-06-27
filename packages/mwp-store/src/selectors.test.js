import { getFeatureFlags } from './selectors';

describe('getFeatureFlags', () => {
	const featureFlags = {
		someBoolFlag: true,
		someStringFlag: 'Some string',
	};

	const state = {
		api: {},
		flags: featureFlags,
	};

	it('should return an object that contains feature flags as keys', () => {
		expect(getFeatureFlags(state)).toEqual(featureFlags);
	});
	it('should return an empty object if flags is empty', () => {
		expect(getFeatureFlags({ ...state, flags: {} })).toEqual({});
	});
	it('should return an empty object if flags is non existant', () => {
		expect(getFeatureFlags({ ...state, flags: undefined })).toEqual({});
	});
});
