export const coerceBool = s => {
	switch(s) {
	case 'true':
		return true;
	case 'false':
		return false;
	default:
		return s;
	}
};

/**
 * simple camel case function - not really interested in edge cases, just
 * straightforward 'this-is-hyphen' to 'thisIsHyphen'
 */
export function toCamelCase(s) {
	return s.replace(/-(\w)/g, g => g[1].toUpperCase());
}

/*
 * Remove surrounding quotes from a string (' and ").
 */
export function removeSurroundingQuotes(str) {
	return str.replace(/^["|']|["|']$/g, '')
}

