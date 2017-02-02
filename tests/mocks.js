const random32 = 'asdfasdfasdfasdfasdfasdfasdfasdf';
export const mockConfig = () => Promise.resolve({
	API_HOST: 'www.api.meetup.com',
	API_TIMEOUT: 10,
	OAUTH_ACCESS_URL: 'http://example.com/access',
	OAUTH_AUTH_URL: 'http://example.com/auth',
	CSRF_SECRET: random32,
	COOKIE_ENCRYPT_SECRET: random32,
	oauth: {
		key: random32,
		secret: random32,
	}
});

