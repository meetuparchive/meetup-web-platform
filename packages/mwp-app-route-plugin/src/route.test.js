import Boom from 'boom';
import { MOCK_RENDER_RESULT } from 'meetup-web-mocks/lib/app';
import { getServer } from 'mwp-test-utils';
import getRoute, { onPreResponse } from './route';

describe('onPreResponse.method', () => {
	it('returns html containing error message', () => {
		const errorMessage = 'foobar';
		const errorCode = 432;
		const request = {
			response: Boom.create(errorCode, errorMessage),
			route: {},
			server: getServer(),
		};
		const replyObj = {
			code() {},
		};
		const spyable = {
			reply: () => replyObj,
		};
		spyOn(replyObj, 'code');
		spyOn(spyable, 'reply').and.callThrough();
		const errorResponse = onPreResponse.method(request, spyable.reply);
		expect(errorResponse).toBe(replyObj);
		const errorMarkup = spyable.reply.calls.mostRecent().args[0];
		expect(errorMarkup).toContain(errorMessage);
		expect(replyObj.code).toHaveBeenCalledWith(errorCode);
	});
	it('returns 500 page', () => {
		const request = {
			response: Boom.create(500, 'foobar'),
			route: {},
			server: getServer(),
		};
		const replyObj = {
			code() {},
		};
		const spyable = {
			reply: () => replyObj,
		};
		spyOn(replyObj, 'code');
		spyOn(spyable, 'reply').and.callThrough();
		const errorResponse = onPreResponse.method(request, spyable.reply);
		expect(errorResponse).toBe(replyObj);
		const errorMarkup = spyable.reply.calls.mostRecent().args[0];
		expect(errorMarkup).toMatchSnapshot();
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
