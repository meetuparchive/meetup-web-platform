import Boom from 'boom';
import {
	MOCK_renderRequestMap,
	MOCK_RENDER_RESULT,
} from 'meetup-web-mocks/lib/app';
import { getServer } from 'mwp-core/lib/util/testUtils';
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
	it('serves the homepage route', () => {
		const server = getServer();
		server.route(getRoute(MOCK_renderRequestMap));
		return server
			.inject({ url: '/' })
			.then(response => expect(response.payload).toEqual(MOCK_RENDER_RESULT));
	});
});
