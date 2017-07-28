import {
	duotoneRef,
	makeSign,
	getDuotoneUrls,
	generateSignedDuotoneUrl,
} from './duotone';

const MOCK_SALT = 'abcd';
const MOCK_DUOTONE = ['123456', '234567'];
const MOCK_DUOTONE_2 = ['345678', '456789'];
describe('makeSign', () => {
	it('creates a function that returns a URL with the ref', () => {
		const ref = duotoneRef(...MOCK_DUOTONE);
		const sign = makeSign(MOCK_SALT, ref);
		expect(sign).toEqual(expect.any(Function));
		const signed = sign('rx100x100');
		expect(signed.startsWith('http')).toBe(true);
		expect(signed.indexOf(ref)).toBeGreaterThan(-1);
	});
});
describe('generateSignedDuotoneUrl', () => {
	const signedUrlMap = generateSignedDuotoneUrl(MOCK_SALT, MOCK_DUOTONE);
	const ref = duotoneRef(...MOCK_DUOTONE);
	it('maps a duotone ref to a string', () => {
		expect(signedUrlMap).toEqual({
			[ref]: {
				small: expect.any(String),
				large: expect.any(String),
			},
		});
	});
});

describe('getDuotoneUrls', () => {
	const duotones = [MOCK_DUOTONE, MOCK_DUOTONE_2];
	it('generates an object with a prop for each duotone ref', () => {
		const duotoneUrls = getDuotoneUrls(duotones, MOCK_SALT);
		const refArray = duotones.map(dt => duotoneRef(...dt));
		expect(duotoneUrls).toEqual(jasmine.any(Object));
		expect(Object.keys(duotoneUrls)).toEqual(refArray);
	});
});
