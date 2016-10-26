import getConfig from './config';

const validConfig = {
	PHOTO_SCALER_SALT: '1234',
	oauth: {
		key: '1234',
		secret: 'asdf',
	}
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
	console.log = () => {};
	it(
		'empty config returns false',
		() => getConfig({})
		.then(config => {
			expect(config).toBe(false);
		})
	);

	const noOauth = { ...validConfig };
	noOauth.oauth = {};
	it(
		'missing oauth returns false',
		() => getConfig(noOauth)
		.then(config => {
			expect(config).toBe(false);
		})
	);

	const noPhotoScaler = { ...validConfig };
	noPhotoScaler.PHOTO_SCALER_SALT = null;
	it(
		'missing PHOTO_SCALER_SALT returns false',
		() => getConfig(noPhotoScaler)
		.then(config => {
			expect(config).toBe(false);
		})
	);
});

