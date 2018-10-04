import { getRedirect } from './server-render';

describe('getRedirect', () => {
	test('escapes UTF-8', () => {
		const context = { url: 'http://www.meetup.com/驚くばかり' };
		expect(getRedirect(context).redirect.url).toMatchInlineSnapshot(
			`"http://www.meetup.com/%E9%A9%9A%E3%81%8F%E3%81%B0%E3%81%8B%E3%82%8A"`
		);
	});
	test('does not modify escaped emoji', () => {
		const context = {
			url:
				'http://www.meetup.com/%E9%A9%9A%E3%81%8F%E3%81%B0%E3%81%8B%E3%82%8A',
		};
		expect(getRedirect(context).redirect.url).toBe(context.url);
	});
	test('does not modify escaped ampersands', () => {
		const context = {
			url: 'http://www.meetup.com/?foo=bar%26baz',
		};
		expect(getRedirect(context).redirect.url).toBe(context.url);
	});
});
