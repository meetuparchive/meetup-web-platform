import { shape, bool, string, object } from 'prop-types';

// https://reacttraining.com/react-router/web/api/match
export const Match = shape({
	isExact: bool,
	params: object.isRequired,
	path: string.isRequired,
	url: string.isRequired,
});
