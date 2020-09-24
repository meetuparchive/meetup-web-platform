import localizedLanguageMap from './localizedLanguageMap';
import { locales, additionalLocales } from 'mwp-config';

describe('localizedLanguageMap', () => {
	it('has a localized name for every item in `mwp-config/locales`', () => {
		locales.forEach(locale => {
			expect(Object.keys(localizedLanguageMap).includes(locale)).toBeTruthy();
		});
	});
	it('has a localized name for every item in `mwp-config/additionalLocales`', () => {
		additionalLocales.forEach(locale => {
			expect(Object.keys(localizedLanguageMap).includes(locale)).toBeTruthy();
		});
	});
});
