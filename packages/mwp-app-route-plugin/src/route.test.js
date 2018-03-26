import Boom from 'boom';
import { MOCK_RENDER_RESULT } from 'meetup-web-mocks/lib/app';
import { getServer } from 'mwp-test-utils';
import getRoute, { onPreResponse, EXTERNAL_TRACK_HEADER, EXTERNAL_TRACK_URL_HEADER } from './route';

describe('onPreResponse.method', () => {
	it('returns html containing error message', () => {

		const errorMessage = 'foobar';
		const errorCode = 432;
		const response = Boom.create(errorCode, errorMessage);
		response.header = ((key, val) => val)

		const request = {
			response,
			route: {},
			server: getServer(),
		};
		const replyObj = {
			code() { },
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
	it('returns X-Meetup-External-Track and X-Meetup-External-Track-Url headers if _xtd query param exists', () => {
		const server = getServer();
		const result = 'ok';
		server.route(
			getRoute({
				'en-US': () => Promise.resolve({ statusCode: 200, result }),
			})
		);
		const mockXtd = 'helloIAmAJunkParam';
		return server
			.inject({ url: `/?junk=junkyjunk&_xtd=${mockXtd}` })
			.then(response => {
				expect(response.headers[EXTERNAL_TRACK_HEADER]).toBe(mockXtd);
				expect(response.headers[EXTERNAL_TRACK_URL_HEADER]).toBe(response.request.url.href);
			});
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
