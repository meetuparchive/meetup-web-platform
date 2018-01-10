import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';

import loadLocaleData from './loadLocaleData';

describe('loadLocaleData', () => {
	it('loads locale data for `fr-FR`', () => {
		loadLocaleData('fr-FR');

		expect(IntlMessageFormat.__localeData__['fr-fr']).not.toBeNull();
		expect(IntlRelativeFormat.__localeData__['fr-fr']).not.toBeNull();
	});

	it('loads locale code `en-US`', () => {
		loadLocaleData('en-US');

		expect(IntlMessageFormat.__localeData__['en-us']).not.toBeNull();
		expect(IntlRelativeFormat.__localeData__['en-us']).not.toBeNull();
	});

	it('does not load unsupported locale', () => {
		loadLocaleData('af-af');

		expect(IntlMessageFormat.__localeData__['af-af']).toBeUndefined();
		expect(IntlRelativeFormat.__localeData__['af-af']).toBeUndefined();
	});
});
