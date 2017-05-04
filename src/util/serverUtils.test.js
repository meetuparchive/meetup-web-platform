import convict from 'convict';
import https from 'https';
import { MOCK_LOGGER, getServer } from './testUtils';
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
		expect(serverUtils.checkForDevUrl({ url: 'www.dev.meetup.com' })).toBe(
			true
		);
		expect(
			serverUtils.checkForDevUrl({
				url1: 'www.meetup.com',
				url2: 'www.dev.meetup.com',
			})
		).toBe(true);
		expect(
			serverUtils.checkForDevUrl({ url: { url: 'www.dev.meetup.com' } })
		).toBe(true);
	});
});

describe('configureEnv', function() {
	beforeEach(() => {
		// cache the 'default' setting for rejectUnauthorized
		this.defaultRejectUnauthorized =
			https.globalAgent.options.rejectUnauthorized;
	});

	afterEach(function() {
		// restore the default setting for rejectUnauthorized
		https.globalAgent.options.rejectUnauthorized = this
			.defaultRejectUnauthorized;
	});

	it('sets global rejectUnauthorized to false when using dev URLs in config', () => {
		serverUtils.configureEnv(convict({
			url: 'www.dev.meetup.com',
		}));
		expect(https.globalAgent.options.rejectUnauthorized).toBe(false);
	});

	it('sets global rejectUnauthorized to true when using prod URLs in config', () => {
		serverUtils.configureEnv(convict({
			url: 'www.meetup.com',
		}));
		expect(https.globalAgent.options.rejectUnauthorized).toBe(true);
	});
});

describe('onRequestExtension', () => {
	const request = {
		headers: 'foo',
		id: 'bar',
		method: 'get',
		info: {},
		url: { href: 'http://example.com' },
		state: {},
		server: getServer(),
	};

	it('calls reply.continue', () => {
		const reply = {
			continue: () => {},
		};
		spyOn(reply, 'continue');
		serverUtils.onRequestExtension(request, reply);
		expect(reply.continue).toHaveBeenCalled();
	});

	it('calls console.log with request headers and id', () => {
		const reply = {
			continue: () => {},
		};
		MOCK_LOGGER.info.mockClear();
		serverUtils.onRequestExtension(request, reply);
		const calledWith = MOCK_LOGGER.info.mock.calls[0][0];
		expect(calledWith).toEqual(expect.stringContaining(request.url.href));
	});
});

describe('logResponse', () => {
	const request = {
		headers: 'foo',
		id: 'bar',
		method: 'get',
		info: {},
		url: {},
		response: {
			headers: { foo: 'bar' },
		},
		server: getServer(),
	};

	it('calls console.log with response headers and request id', () => {
		MOCK_LOGGER.info.mockClear();
		serverUtils.logResponse(request);
		const [data] = MOCK_LOGGER.info.mock.calls[0];
		expect(data).toEqual(expect.any(Object));
	});
});
