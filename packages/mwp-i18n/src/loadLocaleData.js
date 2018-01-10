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
import LocaleDataRU from 'react-intl/locale-data/ru';

import { addLocaleData } from 'react-intl';

const localeMap: { [string]: { data?: Object } } = {
	'en-US': {}, // Use built-in locale-data for en
	'en-AU': {}, // Use built-in locale-data for en
	es: { data: LocaleDataES },
	'es-ES': { data: LocaleDataES },
	'fr-FR': { data: LocaleDataFR },
	'de-DE': { data: LocaleDataDE },
	'it-IT': { data: LocaleDataIT },
	'ja-JP': { data: LocaleDataJA },
	'ko-KR': { data: LocaleDataKO },
	'nl-NL': { data: LocaleDataNL },
	'pl-PL': { data: LocaleDataPL },
	'pt-BR': { data: LocaleDataPT },
	'ru-RU': { data: LocaleDataRU },
	'th-TH': { data: LocaleDataTH },
	'tr-TR': { data: LocaleDataTR },
};

/*
 * Load data for given localeCode into ReactIntl
 */
export default function loadLocaleData(localeCode: ?string) {
	if (!localeCode) {
		return;
	}
	const locale = localeMap[localeCode];
	if (!locale) {
		console.warn(`${localeCode} not supported`);
		return;
	}
	if (!locale.data) {
		// locale is supported but no special config will be loaded
		return;
	}
	addLocaleData(locale.data);
}
