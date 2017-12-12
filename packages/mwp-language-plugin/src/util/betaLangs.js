export const BETA_LANGS = ['ru-RU', 'ru'];

export const isBetaLang = (lang, testBetaLangs) => {
	const betaLangs = testBetaLangs ? testBetaLangs : BETA_LANGS;
	return betaLangs.includes(lang);
};

export const getNotBetaLangs = (langs, testBetaLangs) => {
	const betaLangs = testBetaLangs ? testBetaLangs : BETA_LANGS;
	return langs.filter(lang => betaLangs.indexOf(lang) === -1);
};
