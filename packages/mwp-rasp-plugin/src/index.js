// @flow
import fs from 'fs';
import Sigsci from './sigsci';

// Plugin used to monitor traffic and potentially block bad actors from
// receiving requests from our application
export function register(server: HapiServer, options: ?{ [string]: string }) {
	const path = (options && options.path) || '/var/run/sigsci.sock';
	// test for existence of socket before initializing - no-op if socket unavailable
	if (!fs.existsSync(path)) {
		return;
	}
	const sigsci = new Sigsci({
		path,
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
