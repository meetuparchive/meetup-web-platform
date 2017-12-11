import { getNotBetaLangs, isBetaLang } from './betaLangs';

const betaLangs = ['fr-FR', 'en-GB'];
const langs = ['en-US', 'de-DE', 'fr-FR', 'es', 'ru', 'en-GB'];

describe('isBetaLang', () => {
	it('Detects a beta lang', () => {
		expect(isBetaLang('en-GB', betaLangs)).toEqual(true);
	});

	it('Returns false when not a beta language', () => {
		expect(isBetaLang('en-US', betaLangs)).toEqual(false);
	});
});
describe('getNotBetaLangs', () => {
	it('Returns an array of languages without the beta languages.', () => {
		const nonBetaLangs = ['en-US', 'de-DE', 'es', 'ru'];
		expect(getNotBetaLangs(langs, betaLangs)).toEqual(nonBetaLangs);
	});
});
