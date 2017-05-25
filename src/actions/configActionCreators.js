// @flow
export default (config: { [string]: mixed }) => ({
	type: 'CONFIGURE',
	payload: config,
});
