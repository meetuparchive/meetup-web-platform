import getConfig from './config';

const validConfig = {
	PHOTO_SCALER_SALT: '1234',
	oauth: {
		key: '1234',
		secret: 'asdf',
	},
	duotoneUrls: { foo: 'http://example.com' },
};
describe('getConfig', function() {
	it(
		'returns a promise containing a config object from getConfig',
		() => getConfig(validConfig)
		.then(config => {
			expect(config).toEqual(jasmine.any(Object));
		})
	);
});

describe('getConfig - invalid', function() {
	it(
		'missing PHOTO_SCALER_SALT returns false',
		() => getConfig({ PHOTO_SCALER_SALT: null })
			.then(config => {
				expect(true).toBe(false);  // should not be called
			})
			.catch(err => {
				expect(err).toEqual(jasmine.any(Error));
			})
	);
});

