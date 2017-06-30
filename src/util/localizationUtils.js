// @flow
/**
 * A module for i18n utilities
 * @module localizationUtils
 */

// locale data comes from https://github.com/andyearnshaw/Intl.js/tree/master/locale-data/json
import LocaleDataFR from 'react-intl/locale-data/fr';
import LocaleDataDE from 'react-intl/locale-data/de';
import LocaleDataES from 'react-intl/locale-data/es';
import LocaleDataIT from 'react-intl/locale-data/it';
import LocaleDataJA from 'react-intl/locale-data/ja';
import LocaleDataPT from 'react-intl/locale-data/pt';
import LocaleDataKO from 'react-intl/locale-data/ko';
import LocaleDataNL from 'react-intl/locale-data/nl';
import LocaleDataPL from 'react-intl/locale-data/pl';
import LocaleDataTH from 'react-intl/locale-data/th';
import LocaleDataTR from 'react-intl/locale-data/tr';

import { addLocaleData } from 'react-intl';

const localeMap: { [string]: { data?: Object } } = {
	'en-US': {
		// Use built-in locale-data for en
	},
	'en-AU': {
		// Use built-in locale-data for en
	},
	es: {
		data: LocaleDataES,
	},
	'es-ES': {
		data: LocaleDataES,
	},
	'fr-FR': {
		data: LocaleDataFR,
	},
	'de-DE': {
		data: LocaleDataDE,
	},
	'it-IT': {
		data: LocaleDataIT,
	},
	'ja-JP': {
		data: LocaleDataJA,
	},
	'ko-KR': {
		data: LocaleDataKO,
	},
	'nl-NL': {
		data: LocaleDataNL,
	},
	'pl-PL': {
		data: LocaleDataPL,
	},
	'pt-BR': {
		data: LocaleDataPT,
	},
	'th-TH': {
		data: LocaleDataTH,
	},
	'tr-TR': {
		data: LocaleDataTR,
	},
};

/*
 * Load data for given localeCode into ReactIntl
 */
export function loadLocale(localeCode: ?string) {
	if (!localeCode) {
		return;
	}
	if (!(localeCode in localeMap)) {
		console.warn(`${localeCode} not supported`);
	}
	const locale = localeMap[localeCode] || {};
	addLocaleData(locale.data);
}

/*
 * Get locale code and for given member
 *
 * Note:
 * The api currently returns locale codes with underscores
 * instead of dashes, so this method supports both until fixed.
 */
export function getLocaleCode(self: { lang?: string, [string]: Object }) {
	// Retreive locale code from state (api response)
	return ((self && self.lang) || 'en-US').replace('_', '-');
}
