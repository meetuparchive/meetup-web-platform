export const isServer = () =>
	typeof process !== 'undefined' &&
	process.versions != null &&
	process.versions.node != null;
