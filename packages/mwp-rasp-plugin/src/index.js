// @flow
import Sigsci from 'sigsci-module-nodejs';

// Plugin used to monitor traffic and potentially block bad actors from
// receiving requests from our application
export function register(
	server: HapiServer,
	options: ?{ [string]: string } // see documentation below for options for sigsci
): Promise<any> {
	const sigsci = new Sigsci({
		path: '/var/run/sigsci.sock',
		...options,
	});

	server.ext('onRequest', sigsci.hapi());
	server.on('response', sigsci.hapiEnding());
}

export const plugin = {
	register,
	name: 'mwp-rasp',
	version: '1.0.0',
	depencencies: [
		'sigsci-module-nodejs', // rasp @see https://docs.signalsciences.net/install-guides/nodejs-module/#usage-for-nodejs-hapi
	],
};
