import processClickTracking, { clickCookieOptions } from './clickTrackingReader';

describe('processClickTracking', () => {
	const clickData = {
		history: [{ coords: [1, 2] }, { coords: [1, 2] }],
	};
	const request = {
		state: {
			'click-track': encodeURIComponent(JSON.stringify(clickData)),
		},
		log: jest.fn(),
	};
	const reply = {
		unstate: jest.fn(),
	};

	it('calls request.log for each click record', () => {
		request.log.mockClear();
		processClickTracking(request, reply);
		expect(request.log).toHaveBeenCalledTimes(clickData.history.length);
	});
	it('calls reply.unstate for click-track cookie', () => {
		reply.unstate.mockClear();
		processClickTracking(request, reply);
		expect(reply.unstate)
			.toHaveBeenCalledWith('click-track', clickCookieOptions);
	});
	it('does nothing with no click data', () => {
		request.log.mockClear();
		const emptyRequest = {
			...request,
			state: {},
		};
		processClickTracking(emptyRequest, reply);
		expect(request.log).not.toHaveBeenCalled();
	});
});

