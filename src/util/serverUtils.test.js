import https from 'https';
import Boom from 'boom';
import * as serverUtils from './serverUtils';

describe('checkForDevUrl', () => {
	it('returns true for dev URLs', () => {
		expect(serverUtils.checkForDevUrl('www.dev.meetup.com')).toBe(true);
		expect(serverUtils.checkForDevUrl('secure.dev.meetup.com')).toBe(true);
	});
	it('rejects non-dev URLs and non-objects', () => {
		expect(serverUtils.checkForDevUrl('www.meetup.com')).toBe(false);
		expect(serverUtils.checkForDevUrl('secure.meetup.com')).toBe(false);
		expect(serverUtils.checkForDevUrl(1234)).toBe(false);
		expect(serverUtils.checkForDevUrl(true)).toBe(false);
		expect(serverUtils.checkForDevUrl(new Date())).toBe(false);
	});
	it('returns true for nested dev URLs', () => {
		expect(serverUtils.checkForDevUrl({ url: 'www.dev.meetup.com' })).toBe(true);
		expect(serverUtils.checkForDevUrl({ url1: 'www.meetup.com', url2: 'www.dev.meetup.com' })).toBe(true);
		expect(serverUtils.checkForDevUrl({ url: { url: 'www.dev.meetup.com' } })).toBe(true);
	});
});

describe('configureEnv', function() {
	beforeEach(() => {
		// cache the 'default' setting for rejectUnauthorized
		this.defaultRejectUnauthorized = https.globalAgent.options.rejectUnauthorized;
	});
	afterEach(function() {
		// restore the default setting for rejectUnauthorized
		https.globalAgent.options.rejectUnauthorized = this.defaultRejectUnauthorized;
	});
	it('sets global rejectUnauthorized to false when using dev URLs in config', () => {
		serverUtils.configureEnv({ url: 'www.dev.meetup.com' });
		expect(https.globalAgent.options.rejectUnauthorized).toBe(false);
	});
	it('sets global rejectUnauthorized to true when using prod URLs in config', () => {
		serverUtils.configureEnv({ url: 'www.meetup.com' });
		expect(https.globalAgent.options.rejectUnauthorized).toBe(true);
	});
});

describe('onPreResponse', () => {
	it('returns html containing error message', () => {
		const errorMessage = 'foobar';
		const errorCode = 432;
		const request = {
			response: Boom.create(errorCode, errorMessage)
		};
		const replyObj = {
			code() {}
		};
		const spyable = {
			reply: () => replyObj,
		};
		spyOn(replyObj, 'code');
		spyOn(spyable, 'reply').and.callThrough();
		const errorResponse = serverUtils.onPreResponse(request, spyable.reply);
		expect(errorResponse).toBe(replyObj);
		const errorMarkup = spyable.reply.calls.mostRecent().args[0];
		expect(errorMarkup.indexOf(errorMessage)).toBeGreaterThan(-1);
		expect(replyObj.code).toHaveBeenCalledWith(errorCode);
	});
});


