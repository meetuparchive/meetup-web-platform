import catchMiddleware from './catch';

describe('catchMiddleware', () => {
	it('logs an error when the `next` function throws an error', () => {
		spyOn(console, 'error');

		const theError = new Error('bad news');
		const errorThrower = () => { throw theError; };
		const receivedError = catchMiddleware()(errorThrower)({});
		expect(console.error).toHaveBeenCalled();
		expect(receivedError).toBe(theError);
	});
});

