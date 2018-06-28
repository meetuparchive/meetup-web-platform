// @flow
export const getFeatureFlags = (state: MWPState): FeatureFlags =>
	state.flags || {};
