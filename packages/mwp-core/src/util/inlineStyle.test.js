import { getInlineStyleTags } from './inlineStyle.js';

// `simple-universal-style-loader` reades from `global`,
// so we must mock the data directly in `global.__styles__`
global.__styles__ = [
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
		const result = getInlineStyleTags()[0];
		expect(result).toMatchSnapshot();
	});
});
