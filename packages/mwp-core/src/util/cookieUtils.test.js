import {
	MEMBER_COOKIE,
	parseMemberCookie,
	getVariants,
	BROWSER_ID_COOKIE,
	SIFT_SESSION_COOKIE,
	parseBrowserIdCookie,
	parseSiftSessionCookie,
} from './cookieUtils';

describe('parseMemberCookie', () => {
	it('returns the parsed cookie', () => {
		const requestState = { [MEMBER_COOKIE]: 'foo=bar&baz=bing' };
		expect(parseMemberCookie(requestState)).toEqual({
			foo: 'bar',
			baz: 'bing',
			id: 0,
		});
	});
	it('returns an integer id', () => {
		const values = [
			'foo=bar&baz=bing', // no id
			'id=fabulous',
			'id=0',
			'id=1234',
			'',
		];
		values
			.map(v => ({ [MEMBER_COOKIE]: v }))
			.forEach(state =>
				expect(parseMemberCookie(state).id).toEqual(expect.any(Number))
			);
	});
	it('returns an integer id', () => {
		const ids = [1, 0, 'fabulous'];

		const resultIds = ids
			.map(id => ({ [MEMBER_COOKIE]: `id=${id}` }))
			.map(parseMemberCookie)
			.map(member => member.id);

		expect(resultIds).toEqual(ids.map(id => parseInt(id.toString(), 10) || 0));
	});
	it('returns {id:0} for no-cookie case', () => {
		expect(parseMemberCookie({})).toEqual({ id: 0 });
	});
});

describe('parseBrowserIdCookie', () => {
	it('returns a browser id', () => {
		const requestState = { [BROWSER_ID_COOKIE]: 'id=abc-def-g1234' };
		expect(parseBrowserIdCookie(requestState)).toEqual({
			id: 'abc-def-g1234',
		});
	});
	it('returns an empty string for the id value when there is no id', () => {
		const requestState = { [BROWSER_ID_COOKIE]: '' };
		expect(parseBrowserIdCookie(requestState)).toEqual({
			id: '',
		});
	});
	it('returns an empty string for the id value when there is no browser id cookie', () => {
		expect(parseBrowserIdCookie({})).toEqual({
			id: '',
		});
	});
});

describe('parseSiftSessionIdCookie', () => {
	it('returns a sift session id', () => {
		const requestState = {
			[SIFT_SESSION_COOKIE]: 'bfb3860d-36b4-417c-9ead-99bcc036cf88',
		};
		expect(parseSiftSessionCookie(requestState)).toEqual(
			'bfb3860d-36b4-417c-9ead-99bcc036cf88'
		);
	});
	it('returns an empty object when there is no SIFT_SESSION_COOKIE', () => {
		const requestState = { [SIFT_SESSION_COOKIE]: '' };
		expect(parseSiftSessionCookie(requestState)).toEqual('');
	});
});

describe('getVariants', () => {
	it('creates an object', () => {
		expect(getVariants({})).toEqual(expect.any(Object));
		expect(getVariants({ foo: 'bar' })).toEqual(expect.any(Object));
		expect(getVariants({ MEETUP_VARIANT_FOO_DEV: 'bar' })).toEqual(
			expect.any(Object)
		);
	});
	it('extracts suffix-free key from MEETUP_VARIANT_XXX_DEV', () => {
		const val = 'bar';
		expect(getVariants({ MEETUP_VARIANT_FOO_DEV: val }).FOO).toEqual(val);
	});
});
