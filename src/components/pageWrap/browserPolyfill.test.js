import Joi from 'joi';
import { polyfillServiceUrl } from './browserPolyfill';

describe('polyfillServiceUrl', () => {
	it('returns a url string', () => {
		const url = polyfillServiceUrl();
		expect(Joi.validate(url, Joi.string().uri()).error).toBeNull();
	});
});
