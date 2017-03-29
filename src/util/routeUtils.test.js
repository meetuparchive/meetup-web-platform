import url from 'url';
import { routes } from '../../tests/mockApp';
import { activeRouteQueries } from './routeUtils';

describe('activeRouteQueries', () => {
	it('gathers queries from nested routes', () => {
		const location = url.parse('/foo/bar');
		const expectedQueries = [
			routes[0].query(),
			routes[0].routes[0].routes[0].query(),
		];
		const receivedQueries = activeRouteQueries(routes)(location);
		expect(receivedQueries).toEqual(expectedQueries);
	});
	it('gathers queries from root index route', () => {
		const location = url.parse('/');
		const expectedQueries = [
			routes[0].query(),
			routes[0].indexRoute.query(),
		];
		const receivedQueries = activeRouteQueries(routes)(location);
		expect(receivedQueries).toEqual(expectedQueries);
	});
	it('gathers queries from nested index route', () => {
		const location = url.parse('/foo');
		const expectedQueries = [
			routes[0].query(),
			routes[0].routes[0].indexRoute.query(),
		];
		const receivedQueries = activeRouteQueries(routes)(location);
		expect(receivedQueries).toEqual(expectedQueries);
	});
	it('matches nested wildcard urls', () => {
		const location = url.parse('/param1value/param2value');
		const receivedQueries = activeRouteQueries(routes)(location);
		expect(receivedQueries).toHaveLength(3);  // root, param1, param2
	});
	it('passes all parsed url params into query', () => {
		const param1 = 'param1value';
		const param2 = 'param2value';
		const location = url.parse(`/${param1}/${param2}`);
		const expectedParams = [ {}, { param1 }, { param1, param2 } ];
		const receivedQueries = activeRouteQueries(routes)(location);
		expect(receivedQueries.map(({ params }) => params)).toEqual(expectedParams);
	});
	it('matches utf-8 urls', () => {
		const param1 = '驚くばかり';
		const location = url.parse(`/${param1}`);
		const expectedParams = [ {}, { param1 } ];
		const receivedQueries = activeRouteQueries(routes)(location);
		expect(receivedQueries.map(({ params }) => params)).toEqual(expectedParams);
	});
});
