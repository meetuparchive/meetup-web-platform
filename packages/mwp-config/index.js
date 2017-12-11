module.exports = {
	babel: require('./babel'),
	env: require('./env'),
	locales: require('./locales'),
	localesSecondary: require('./localesSecondary'),
	package: require('./package'),
	paths: require('./paths'),
	webpack: require('./webpack'),
	getServer: () => require('./server'), // this is a getter because it validates environment config at runtime
};
