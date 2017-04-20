import Boom from 'boom';
import { getServer } from '../util/testUtils';
import { onPreResponse } from './appRoute';

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
			code() {}
		};
		const spyable = {
			reply: () => replyObj,
		};
		spyOn(replyObj, 'code');
		spyOn(spyable, 'reply').and.callThrough();
		const errorResponse = onPreResponse.method(request, spyable.reply);
		expect(errorResponse).toBe(replyObj);
		const errorMarkup = spyable.reply.calls.mostRecent().args[0];
		expect(errorMarkup.indexOf(errorMessage)).toBeGreaterThan(-1);
		expect(replyObj.code).toHaveBeenCalledWith(errorCode);
	});
});

