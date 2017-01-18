import Joi from 'joi';

export const querySchema = Joi.object({
	endpoint: Joi.string().required(),
	flags: Joi.array(),
	params: Joi.object(),
	ref: Joi.string().required(),
	type: Joi.string().required(),
});

