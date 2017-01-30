import {
	coerceBool,
	toCamelCase,
	cleanRawCookies,
} from './stringUtils';

describe('coerceBool', () => {
	it('turns boolean strings into real Booleans', () => {
		expect(coerceBool('true')).toBe(true);
		expect(coerceBool('false')).toBe(false);
	});
	it('leaves non-bool strings unchanged', () => {
		const identityCamel = s => expect(coerceBool(s)).toBe(s);

		identityCamel('notbool');
		identityCamel('1234.345');
		identityCamel('0');
		identityCamel('TRUE');
	});
});

describe('toCamelCase', () => {
	it('turns hyphenated words into camelCase', () => {
		expect(toCamelCase('a-good-one')).toEqual('aGoodOne');
		expect(toCamelCase('a')).toEqual('a');
		expect(toCamelCase('request-id')).toEqual('requestId');
		expect(toCamelCase('')).toEqual('');
		expect(toCamelCase('this-is-compLICAT-ED')).toEqual('thisIsCompLICATED');
	});
});
describe('cleanRawCookies', () => {
	const singleQuotedString = `'single "quotes" have more fun'`;
	const cookieSeparatorString = `foo=bar; baz="something with spaces"`;


	it('Removes surrounding single quotes', () => {
		expect(cleanRawCookies(singleQuotedString)).toEqual(`single%20%22quotes%22%20have%20more%20fun`);
	});
	it('Doesn\'t encode the cookie separator', () => {
		expect(cleanRawCookies(cookieSeparatorString)).toEqual(`foo=bar; baz=%22something%20with%20spaces%22`);
	});
});
