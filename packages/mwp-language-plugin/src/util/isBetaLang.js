const isBetaLang = lang => {
	const betaLangs = ['ru-RU'];
	return betaLangs.includes(lang);
};

export default isBetaLang;
