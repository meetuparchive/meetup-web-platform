module.exports = {
	env: require('./env'),
	locales: require('./locales'),
	localesShortNames: require('./localesShortNames'),
	localesSecondary: require('./localesSecondary'),
	package: require('./package'),
	paths: require('./paths'),
	getServer: () => require('./server'), // this is a getter because it validates environment config at runtime
};
