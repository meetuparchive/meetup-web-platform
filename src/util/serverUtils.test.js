import https from 'https';
import * as serverUtils from './serverUtils';

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
		serverUtils.configureEnv({
			isProd: false
		});
		expect(https.globalAgent.options.rejectUnauthorized).toBe(false);
	});

	it('sets global rejectUnauthorized to true when using prod URLs in config', () => {
		serverUtils.configureEnv({
			isProd: true
		});
		expect(https.globalAgent.options.rejectUnauthorized).toBe(true);
	});
});

describe('onRequestExtension', () => {
	const request = {
		headers: 'foo',
		id: 'bar',
		method: 'get',
		info: {},
		url: {},
		state: {},
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
		spyOn(global.console, 'log');
		serverUtils.onRequestExtension(request, reply);
		const calledWith = console.log.calls.mostRecent().args[0];
		expect(JSON.parse(calledWith).info.headers).toEqual(request.headers);
		expect(JSON.parse(calledWith).info.id).toBe(request.id);
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
	};

	it('calls console.log with response headers and request id', () => {
		spyOn(global.console, 'log');
		serverUtils.logResponse(request);
		const calledWith = console.log.calls.mostRecent().args[0];
		expect(JSON.parse(calledWith).info.headers).toEqual(request.response.headers);
		expect(JSON.parse(calledWith).info.id).toBe(request.id);
	});
});
