export const BETA_LANGS = ['ru-RU', 'ru'];

export const isBetaLang = (lang, testBetaLangs) => {
	const betaLangs = testBetaLangs ? testBetaLangs : BETA_LANGS;
	console.warn(testBetaLangs);
	console.warn(betaLangs);
	return betaLangs.includes(lang);
};

export const getNotBetaLangs = (langs, testBetaLangs) => {
	const betaLangs = testBetaLangs ? testBetaLangs : BETA_LANGS;
	console.warn(betaLangs);
	return langs.filter(lang => betaLangs.indexOf(lang) === -1);
};
