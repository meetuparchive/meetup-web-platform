export default function getRoutes() {
	const pingRoute = {
		path: '/ping',
		method: 'GET',
		handler: (request, reply) => reply('pong!'),
		config: { auth: false },
	};

	return [pingRoute];
}
