module.exports = {
	env: require('./env'),
	locales: require('./locales'),
	localesSecondary: require('./localesSecondary'),
	package: require('./package'),
	paths: require('./paths'),
	monorepoPaths: require('./monorepo/paths'),
	getServer: () => require('./server'), // this is a getter because it validates environment config at runtime
};
