// @flow
import Sigsci from './sigsci';

// Plugin used to monitor traffic and potentially block bad actors from
// receiving requests from our application
export function register(
	server: HapiServer,
	options: ?{ [string]: string }
): Promise<any> {
	const sigsci = new Sigsci({
		path: '/var/run/sigsci.sock',
		...options,
	});

	server.ext('onRequest', sigsci.hapi());
	server.events.on('response', sigsci.hapiEnding());
}

export const plugin = {
	register,
	name: 'mwp-rasp',
	version: '1.0.0',
};
