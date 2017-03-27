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
	it('matches nested wildcard urls', () => {
		const receivedQueries = activeRouteQueries(routes)('/param1value/param2value');
		expect(receivedQueries).toHaveLength(3);  // root, param1, param2
	});
	it('passes all parsed url params into query', () => {
		const param1 = 'param1value';
		const param2 = 'param2value';
		const expectedParams = [ {}, { param1 }, { param1, param2 } ];
		const receivedQueries = activeRouteQueries(routes)(`/${param1}/${param2}`);
		expect(receivedQueries.map(({ params }) => params)).toEqual(expectedParams);
	});
	it('matches utf-8 urls', () => {
		const param1 = '驚くばかり';
		const expectedParams = [ {}, { param1 } ];
		const receivedQueries = activeRouteQueries(routes)(`/${param1}`);
		expect(receivedQueries.map(({ params }) => params)).toEqual(expectedParams);
	});
});
