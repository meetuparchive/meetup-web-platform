import Hapi from 'hapi';
import LoggerPlugin from './';

const testServer = test => {
	const server = new Hapi.Server();
	server.connection({ port: 0 });
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
			response.request.server.app.logger.info({ foo: 'bar' }, 'asdfasd');
			response.request.server.app.logger.info(response.request.raw, 'asdfasd');
			response.request.server.app.logger.error(new Error('asdfasd'), 'asdfasd');
			response.request.server.app.logger.debug({ foo: 'bar' }, 'asdfasd');
			expect(response.request.server.app.logger).toBeDefined();
		});
	});
});
