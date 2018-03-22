import { getInlineStyleTags } from './inlineStyle.js';

// `simple-universal-style-loader` reades from `global`,
// so we must mock the data directly in `global.__styles__`
const MOCK_GLOBAL_STYLES = [
	{
		id: 666,
		parts: [
			{
				css: '.foo { overflow: inherit; }',
				media: ''
			}
		]
	}
];

describe('getInlineStyleTags', () => {
	it('matches snapshot', () => {
		global.__styles__ = MOCK_GLOBAL_STYLES;
		const result = getInlineStyleTags()[0];
		expect(result).toMatchSnapshot();
		global.__styles__ = null;
	});
	it('does not throw when global styles are not populated', () => {
		expect(() => getInlineStyleTags()).not.toThrow();
	});
});
