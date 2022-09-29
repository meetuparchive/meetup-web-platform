import {
	getGoogleTagManagerSnippet,
	getDataLayerInitSnippet,
	gtmPush,
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

	it('should extend event mocked variables payload with isTestAccount: Yes', () => {
		const IS_TEST_ACCOUNT_VARS = { isTestAccount: 'Yes' };
		global.window = {};
		window.dataLayer = [];
		window.sessionStorage = {
			getItem: () => 'Yes',
		};

		gtmPush(MOCK_VARS);
		expect(window.dataLayer).toContainEqual({
			...MOCK_VARS,
			...IS_TEST_ACCOUNT_VARS,
		});
	});
});
