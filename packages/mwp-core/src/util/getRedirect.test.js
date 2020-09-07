import getRedirect from './getRedirect';

describe('getRedirect', () => {
	test('does nothing if url is empty', () => {
		expect(getRedirect({})).toBeUndefined();
		expect(getRedirect({ url: undefined })).toBeUndefined();
		expect(getRedirect({ url: '' })).toBeUndefined();
	});
	test('escapes UTF-8', () => {
		const path = '/驚くばかり';
		expect(
			getRedirect({ url: `http://www.meetup.com${path}` }).redirect.url
		).toMatchInlineSnapshot(
			`"http://www.meetup.com/%E9%A9%9A%E3%81%8F%E3%81%B0%E3%81%8B%E3%82%8A"`
		);
		expect(getRedirect({ url: path }).redirect.url).toMatchInlineSnapshot(
			`"/%E9%A9%9A%E3%81%8F%E3%81%B0%E3%81%8B%E3%82%8A"`
		);
	});
	test('does not modify escaped emoji', () => {
		const path = '/%E9%A9%9A%E3%81%8F%E3%81%B0%E3%81%8B%E3%82%8A';
		expect(
			getRedirect({
				url: path,
			}).redirect.url
		).toBe(path);
	});
	test('does not modify escaped ampersands', () => {
		const path = '/?foo=bar%26baz';
		expect(
			getRedirect({
				url: path,
			}).redirect.url
		).toBe(path);
	});
});
