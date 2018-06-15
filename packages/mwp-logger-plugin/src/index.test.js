import Hapi from 'hapi';
import LoggerPlugin from './';

const testServer = test => {
	const server = Hapi.server({
		port: 0,
	});

	return server
		.register(LoggerPlugin)
		.then(() =>
			server.route({
				method: 'GET',
				path: '/{wild*}',
				handler: (request, reply) => reply('okay'),
			})
		)
		.then(() => server.inject({ url: '/ping' }))
		.then(test)
		.then(() => server.stop())
		.catch(err => {
			server.stop();
			throw err;
		});
};

describe('mwp logger', () => {
	it('sets server.app.logger', () => {
		testServer(response => {
			expect(response.request.server.app.logger).toBeDefined();
		});
	});
});
