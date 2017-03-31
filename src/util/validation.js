import Joi from 'joi';

export const querySchema = Joi.object({
	endpoint: Joi.string().required(),
	ref: Joi.string().required(),
	flags: Joi.array(),
	mockResponse: Joi.object(),
	params: Joi.object(),  // can be FormData
	type: Joi.string(),
	meta: Joi.object({
		method: Joi.string().only('get', 'post', 'delete', 'patch'),
	}),
});

