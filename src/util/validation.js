import Joi from 'joi';

export const querySchema = Joi.object({
	type: Joi.string().required(),
	ref: Joi.string().required(),
	params: Joi.object().required(),
	flags: Joi.array(),
});

