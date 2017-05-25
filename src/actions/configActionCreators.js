// @flow
export const configure = (config: { [string]: mixed }) => ({
	type: 'CONFIGURE',
	payload: config,
});
export const configureSupportedLocaleCodes = (
	supportedLocaleCodes: Array<string>
) => configure({ supportedLocaleCodes });

export const configureLocaleCode = (localeCode: string) =>
	configure({ localeCode });

export const configureApiUrl = (apiUrl: string) => configure({ apiUrl });

export const configureBaseUrl = (baseUrl: string) => configure({ baseUrl });
