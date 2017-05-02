/**
 * A module for i18n utilities
 * @module localizationUtils
 */

import LocaleDataFR from 'react-intl/locale-data/fr';
import LocaleDataDE from 'react-intl/locale-data/de';
import LocaleDataJA from 'react-intl/locale-data/ja';
import LocaleDataES from 'react-intl/locale-data/es';
import LocaleDataIT from 'react-intl/locale-data/it';
import LocaleDataPT from 'react-intl/locale-data/pt';

import { addLocaleData } from 'react-intl';

const localeMap = {
	'en-US': {
		// Use built-in locale-data for en
	},
	'en-AU': {
		// Use built-in locale-data for en
	},
	'de-DE': {
		data: LocaleDataDE,
	},
	'fr-FR': {
		data: LocaleDataFR,
	},
	'ja-JP': {
		data: LocaleDataJA,
	},
	'it-IT': {
		data: LocaleDataIT,
	},
	'pt-BR': {
		data: LocaleDataPT,
	},
	'es-ES': {
		data: LocaleDataES,
	},
	es: {
		data: LocaleDataES,
	},
};

/**
 * Load data for given localeCode into ReactIntl
 *
 * @method loadLocale
 * @param localeCode {String}
 */
export function loadLocale(localeCode) {
	const locale = localeMap[localeCode] || {};
	addLocaleData(locale.data);
}

/**
 * Get locale code and for given member
 *
 * Note:
 * The api currently returns locale codes with underscores
 * instead of dashes, so this method supports both until fixed.
 *
 * @method getLocaleCode
 * @param self {Object} Object representing member from state
 * @returns {String} Locale code for member, i.e., 'fr-FR'
 */
export function getLocaleCode(self) {
	// Retreive locale code from state (api response)
	return ((self && self.lang) || 'en-US').replace('_', '-');
}
