import https from 'https';
import start, {
	checkForDevUrl,
	configureEnv,
} from './server';

describe('checkForDevUrl', () => {
	it('returns true for dev URLs', () => {
		expect(checkForDevUrl('www.dev.meetup.com')).toBe(true);
		expect(checkForDevUrl('secure.dev.meetup.com')).toBe(true);
	});
	it('rejects non-dev URLs and non-objects', () => {
		expect(checkForDevUrl('www.meetup.com')).toBe(false);
		expect(checkForDevUrl('secure.meetup.com')).toBe(false);
		expect(checkForDevUrl(1234)).toBe(false);
		expect(checkForDevUrl(true)).toBe(false);
		expect(checkForDevUrl(new Date())).toBe(false);
	});
	it('returns true for nested dev URLs', () => {
		expect(checkForDevUrl({ url: 'www.dev.meetup.com' })).toBe(true);
		expect(checkForDevUrl({ url1: 'www.meetup.com', url2: 'www.dev.meetup.com' })).toBe(true);
		expect(checkForDevUrl({ url: { url: 'www.dev.meetup.com' } })).toBe(true);
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
		configureEnv({ url: 'www.dev.meetup.com' });
		expect(https.globalAgent.options.rejectUnauthorized).toBe(false);
	});
	it('sets global rejectUnauthorized to true when using prod URLs in config', () => {
		configureEnv({ url: 'www.meetup.com' });
		expect(https.globalAgent.options.rejectUnauthorized).toBe(true);
	});
});

describe('server', () => {
	it('starts', () =>
		start({}, {}).then(server => server.stop()).then(() => expect(true).toBe(true))
	);
});

