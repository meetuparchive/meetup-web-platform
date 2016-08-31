import { duotoneRef, getDuotoneUrls, generateSignedDuotoneUrl } from './duotone';

const MOCK_SALT = 'abcd';
const MOCK_DUOTONE = ['123456', '234567'];
const MOCK_DUOTONE_2 = ['345678', '456789'];
describe('generateSignedDuotoneUrl', () => {
	const signedUrlMap = generateSignedDuotoneUrl(MOCK_SALT, MOCK_DUOTONE);
	const ref = duotoneRef(...MOCK_DUOTONE);
	it('maps a duotone ref to a string', () => {
		expect(signedUrlMap).toEqual({
			[ref]: jasmine.any(String)
		});
	});
	it('writes a url containing the ref', () => {
		expect(signedUrlMap[ref].startsWith('http')).toBe(true);
		expect(signedUrlMap[ref].indexOf(ref)).toBeGreaterThan(-1);
	});
});

describe('getDuotoneUrls', () => {
	const duotones = [
		MOCK_DUOTONE,
		MOCK_DUOTONE_2
	];
	it('generates an object with a prop for each duotone ref', () => {
		const duotoneUrls = getDuotoneUrls(duotones, MOCK_SALT);
		const refArray = duotones.map(dt => duotoneRef(...dt));
		expect(duotoneUrls).toEqual(jasmine.any(Object));
		expect(Object.keys(duotoneUrls)).toEqual(refArray);
	});
});

