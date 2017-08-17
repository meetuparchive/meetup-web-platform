import { coerceBool, toCamelCase } from './stringUtils';

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
