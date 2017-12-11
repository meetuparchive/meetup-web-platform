// Beta languages should not redirect traffic to language folders automatically.
const isBetaLang = lang => {
	const betaLangs = ['ru-RU', 'ru'];
	return betaLangs.includes(lang);
};

export default isBetaLang;
