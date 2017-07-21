import { mockQuery } from 'meetup-web-mocks/lib/app';

import {
	MOCK_DUOTONE_URLS,
	MOCK_GROUP,
	MOCK_MEMBER,
} from 'meetup-web-mocks/lib/api';

import {
	apiResponseDuotoneSetter,
	duotoneRef,
	getDuotoneUrls,
	groupDuotoneSetter,
	generateSignedDuotoneUrl,
} from './duotone';

const MOCK_SALT = 'abcd';
const MOCK_DUOTONE = ['123456', '234567'];
const MOCK_DUOTONE_2 = ['345678', '456789'];
describe('generateSignedDuotoneUrl', () => {
	const signedUrlMap = generateSignedDuotoneUrl(MOCK_SALT, MOCK_DUOTONE);
	const ref = duotoneRef(...MOCK_DUOTONE);
	it('maps a duotone ref to a string', () => {
		expect(signedUrlMap).toEqual({
			[ref]: jasmine.any(String),
		});
	});
	it('writes a url containing the ref', () => {
		expect(signedUrlMap[ref].startsWith('http')).toBe(true);
		expect(signedUrlMap[ref].indexOf(ref)).toBeGreaterThan(-1);
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

describe('groupDuotoneSetter', () => {
	it('adds duotone url to group object', () => {
		const group = { ...MOCK_GROUP };
		const modifiedGroup = groupDuotoneSetter(MOCK_DUOTONE_URLS)(group);
		const { duotoneUrl } = modifiedGroup;
		const expectedUrl = MOCK_DUOTONE_URLS.dtaxb;
		expect(duotoneUrl.startsWith(expectedUrl)).toBe(true);
	});
});

describe('apiResponseDuotoneSetter', () => {
	it('adds duotone url to type: "group" api response', () => {
		const group = { ...MOCK_GROUP };
		const { ref, type } = mockQuery({});
		expect(group.duotoneUrl).toBeUndefined();
		const groupApiResponse = {
			ref,
			type,
			value: group,
		};
		const modifiedResponse = apiResponseDuotoneSetter(MOCK_DUOTONE_URLS)(
			groupApiResponse
		);
		const { duotoneUrl } = modifiedResponse.value;
		const expectedUrl = MOCK_DUOTONE_URLS.dtaxb;
		expect(duotoneUrl.startsWith(expectedUrl)).toBe(true);
	});
	it('adds duotone url to type: "home" api response', () => {
		// this is an awkward test because we have to mock the deeply-nested
		// self/home endpoint and then look for a property deep inside it
		const group = { ...MOCK_GROUP };
		expect(group.duotoneUrl).toBeUndefined();
		const homeApiResponse = {
			ref: 'memberHome',
			type: 'home',
			value: {
				rows: [
					{
						items: [
							{
								type: 'group',
								group,
							},
						],
					},
				],
			},
		};
		// run the function - rely on side effect in group
		apiResponseDuotoneSetter(MOCK_DUOTONE_URLS)(homeApiResponse);
		const expectedUrl = MOCK_DUOTONE_URLS.dtaxb;
		expect(group.duotoneUrl.startsWith(expectedUrl)).toBe(true);
	});
	it("returns object unmodified when it doesn't need duotones", () => {
		const member = { ...MOCK_MEMBER };
		const memberResponse = {
			ref: 'self',
			type: 'member',
			value: member,
		};
		apiResponseDuotoneSetter(MOCK_DUOTONE_URLS)(memberResponse);
		expect(member).toEqual(MOCK_MEMBER);
	});
	it('returns object unmodified when it contains errors', () => {
		const errorResponse = {
			self: {
				type: 'member',
				value: {
					error: new Error(),
				},
			},
		};
		const errorExpectedResponse = { ...errorResponse };
		apiResponseDuotoneSetter(MOCK_DUOTONE_URLS)(errorResponse);
		expect(errorResponse).toEqual(errorExpectedResponse);
	});
});
