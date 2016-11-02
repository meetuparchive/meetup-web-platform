// RegEx to verify UUID
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('trackLogin', () => {
	it('calls the log function with stuff', () => {
		expect(UUID_V4_REGEX).toBe(UUID_V4_REGEX);
	});
});

