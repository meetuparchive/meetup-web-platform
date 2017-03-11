import { routes } from '../../tests/mockApp';
import { activeRouteQueries } from './routeUtils';

describe('activeRouteQueries', () => {
	it('gathers queries from nested routes', () => {
		const expectedQueries = [
			routes[0].query(),
			routes[0].routes[0].routes[0].query(),
		];
		const receivedQueries = activeRouteQueries(routes)('/foo/bar');
		expect(receivedQueries).toEqual(expectedQueries);
	});
	it('gathers queries from root index route', () => {
		const expectedQueries = [
			routes[0].query(),
			routes[0].indexRoute.query(),
		];
		const receivedQueries = activeRouteQueries(routes)('/');
		expect(receivedQueries).toEqual(expectedQueries);
	});
	it('gathers queries from nested index route', () => {
		const expectedQueries = [
			routes[0].query(),
			routes[0].routes[0].indexRoute.query(),
		];
		const receivedQueries = activeRouteQueries(routes)('/foo');
		expect(receivedQueries).toEqual(expectedQueries);
	});
});
