import Boom from 'boom';
import { getServer } from 'mwp-test-utils';
import getRoute, { onPreResponse } from './route';

describe('onPreResponse.method', () => {
	it('returns html containing error message', () => {
		const errorMessage = 'foobar';
		const errorCode = 432;
		const response = new Boom(errorMessage, {
			statusCode: errorCode,
		});
		response.header = (key, val) => val;

		const request = {
			response,
			route: {},
			server: getServer(),
		};
		const responseObj = {
			code() {},
			response() {},
		};
		const spyable = {
			response: () => responseObj,
		};
		spyOn(responseObj, 'code');
		spyOn(spyable, 'response').and.callThrough();
		const errorResponse = onPreResponse.method(request, spyable.response);
		expect(errorResponse).toBe(responseObj);
		const errorMarkup = spyable.response.calls.mostRecent().args[0];
		expect(errorMarkup).toContain(errorMessage);
		expect(responseObj.code).toHaveBeenCalledWith(errorCode);
	});
	it('serves the homepage route', () => {
		const server = getServer();
		const result = 'ok';
		server.route(
			getRoute({
				'en-US': () => Promise.resolve({ statusCode: 200, result }),
			})
		);
		return server
			.inject({ url: '/' })
			.then(response => expect(response.payload).toEqual(result));
	});
});
