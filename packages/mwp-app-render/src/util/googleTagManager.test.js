import {
	getGoogleTagManagerSnippet,
	getDataLayerInitSnippet,
	gtmPush,
	IS_TEST_ACCOUNT_FLAG,
	PRICING_EXPERIMENT_GROUP_FLAG,
} from './googleTagManager';

describe('getGoogleTagManagerSnippet()', () => {
	const MOCK_GTM_KEY = 'GTM-CONTAINER-ID';
	const MOCK_GTM_PUBLIC_AUTH = 'qwertyuiopasdfghjklzxcvbnm';
	const MOCK_GTM_PREVIEW_ID = 'env-42';

	it('matches snap', () => {
		expect(getGoogleTagManagerSnippet()).toMatchSnapshot();
	});
	it('matches snap with parameters passed', () => {
		expect(
			getGoogleTagManagerSnippet(
				MOCK_GTM_KEY,
				MOCK_GTM_PUBLIC_AUTH,
				MOCK_GTM_PREVIEW_ID
			)
		).toMatchSnapshot();
	});
});

describe('getDataLayerInitSnippet()', () => {
	const MOCK_INIT_DATA = { foo: 'bar' };

	it('should match the snapshot without `data` passed', () => {
		expect(getDataLayerInitSnippet()).toMatchSnapshot();
	});

	it('should match the snapshot with some `data`', () => {
		expect(getDataLayerInitSnippet(MOCK_INIT_DATA)).toMatchSnapshot();
	});
});

describe('gtmPush()', () => {
	const MOCK_VARS = { foo: 'bar' };

	it('should push mocked variables to `dataLayer`', () => {
		global.window = {};
		window.dataLayer = [];

		gtmPush(MOCK_VARS);
		expect(window.dataLayer).toContainEqual(MOCK_VARS);
	});

	it('should extend event mocked variables payload with isTestAccount: Yes and experimentGroup: control', () => {
		const IS_TEST_ACCOUNT_VARS = { isTestAccount: 'Yes' };
		const PRICING_EXPERIMENT_GROUP_VARS = { experimentGroup: 'control' };
		global.window = {};
		window.dataLayer = [];
		window.sessionStorage = {
			getItem: jest.fn().mockImplementation(key => {
				if (key === IS_TEST_ACCOUNT_FLAG) {
					return 'Yes';
				}
				if (key === PRICING_EXPERIMENT_GROUP_FLAG) {
					return 'control';
				}

				return null;
			}),
		};

		gtmPush(MOCK_VARS);
		expect(window.dataLayer).toContainEqual({
			...MOCK_VARS,
			...IS_TEST_ACCOUNT_VARS,
			...PRICING_EXPERIMENT_GROUP_VARS,
		});
	});
});
