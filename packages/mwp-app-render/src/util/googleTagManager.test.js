import {
	getGoogleTagManagerSnippet,
	getDataLayerInitSnippet,
	gtmPush,
} from './googleTagManager';

describe('getGoogleTagManagerSnippet()', () => {
	it('matches snap', () => {
		expect(getGoogleTagManagerSnippet()).toMatchSnapshot();
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
		expect(window.dataLayer).toContain(MOCK_VARS);
	});
});
