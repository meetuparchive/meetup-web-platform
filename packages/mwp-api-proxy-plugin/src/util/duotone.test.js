import { mockQuery } from 'meetup-web-mocks/lib/app';

import {
	MOCK_DUOTONE_URLS,
	MOCK_GROUP,
	MOCK_MEMBER,
} from 'meetup-web-mocks/lib/api';

import {
	apiResponseDuotoneSetter,
	duotoneRef,
	makeSign,
	groupDuotoneSetter,
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

describe('groupDuotoneSetter', () => {
	it('adds duotone url to group object', () => {
		const group = { ...MOCK_GROUP };
		const modifiedGroup = groupDuotoneSetter(MOCK_DUOTONE_URLS)(group);
		const { duotoneUrl } = modifiedGroup;
		const expectedUrl = MOCK_DUOTONE_URLS.dtaxb;
		expect(duotoneUrl.large.startsWith(expectedUrl.large)).toBe(true);
		expect(duotoneUrl.small.startsWith(expectedUrl.small)).toBe(true);
	});
});
describe('apiResponseDuotoneSetter', () => {
	it('adds duotone url to type: "group" api response with key_photo', () => {
		const group = { ...MOCK_GROUP, duotoneUrl: undefined };
		const { ref, type } = mockQuery({});
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
		expect(duotoneUrl.large.startsWith(expectedUrl.large)).toBe(true);
		expect(duotoneUrl.small.startsWith(expectedUrl.small)).toBe(true);
	});
	it('adds duotone url to type: "group" api response with only group_photo and no key_photo', () => {
		const group = {
			...MOCK_GROUP,
			key_photo: undefined,
			duotoneUrl: undefined,
		};
		const { ref, type } = mockQuery({});
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
		expect(duotoneUrl.large.startsWith(expectedUrl.large)).toBe(true);
		expect(duotoneUrl.small.startsWith(expectedUrl.small)).toBe(true);
	});
	it('adds duotone url to type: "home" api response', () => {
		// this is an awkward test because we have to mock the deeply-nested
		// self/home endpoint and then look for a property deep inside it
		const group = { ...MOCK_GROUP, duotoneUrl: undefined };
		const homeApiResponse = {
			ref: 'exploreHome',
			type: 'home',
			value: {
				most_popular: [
					{
						group,
					},
				],
			},
		};
		// run the function - rely on side effect in group
		apiResponseDuotoneSetter(MOCK_DUOTONE_URLS)(homeApiResponse);
		const expectedUrl = MOCK_DUOTONE_URLS.dtaxb;
		expect(group.duotoneUrl.large.startsWith(expectedUrl.large)).toBe(true);
		expect(group.duotoneUrl.small.startsWith(expectedUrl.small)).toBe(true);
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
