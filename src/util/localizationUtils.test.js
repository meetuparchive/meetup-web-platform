import IntlMessageFormat from 'intl-messageformat';
import IntlRelativeFormat from 'intl-relativeformat';

import {
	MOCK_SELF,
	MOCK_SELF_FR
} from 'meetup-web-mocks/lib/api';

import {
	getLocaleCode,
	loadLocale
} from './localizationUtils';

describe('localizationUtils', () => {

	describe('exports', () => {
		it('exports `getLocaleCode`', () => {
			expect(getLocaleCode).toEqual(jasmine.any(Function));
		});

		it('exports `loadLocale`', () => {
			expect(loadLocale).toEqual(jasmine.any(Function));
		});
	});

	describe('getLocaleCode()', () => {
		it('returns an IANA language tag', () => {
			const localeCode = getLocaleCode(MOCK_SELF);
			expect(localeCode).not.toBeNull();
			expect(localeCode).toEqual('en-US');
			expect(getLocaleCode(MOCK_SELF_FR)).toEqual('fr-FR');
		});
	});

	describe('loadLocale()', () => {
		it('loads locale data for `fr-FR`', () => {
			loadLocale('fr-FR');

			expect(IntlMessageFormat.__localeData__['fr-fr']).not.toBeNull();
			expect(IntlRelativeFormat.__localeData__['fr-fr']).not.toBeNull();

		});

		it('loads locale code `en-US`', () => {
			loadLocale('en-US');

			expect(IntlMessageFormat.__localeData__['en-us']).not.toBeNull();
			expect(IntlRelativeFormat.__localeData__['en-us']).not.toBeNull();
		});

		it('does not load unsupported locale', () => {
			loadLocale('af-af');

			expect(IntlMessageFormat.__localeData__['af-af']).toBeUndefined();
			expect(IntlRelativeFormat.__localeData__['af-af']).toBeUndefined();
		});
	});

});
