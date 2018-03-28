import processClickTracking, { clickCookieOptions } from './clickReader';
import { COOKIE_NAME } from './clickState';

describe('processClickTracking', () => {
	const click = { lineage: '', coords: [1, 2] };
	const clickData = {
		history: [click, click],
	};
	const request = {
		state: {
			[COOKIE_NAME]: encodeURIComponent(JSON.stringify(clickData)),
			MEETUP_MEMBER: 'id=1234',
			MEETUP_MEMBER_DEV: 'id=1234',
		},
		log: jest.fn(),
		id: '1234',
	};
	const reply = {
		unstate: jest.fn(),
	};
	process.stdout.write = jest.fn(process.stdout.write);

	it('calls process.stdout.write for each click record', () => {
		process.stdout.write.mockClear();
		processClickTracking(request, reply);
		expect(process.stdout.write).toHaveBeenCalledTimes(clickData.history.length);
	});
	it('calls reply.unstate for click-track cookie', () => {
		reply.unstate.mockClear();
		processClickTracking(request, reply);
		expect(reply.unstate).toHaveBeenCalledWith(COOKIE_NAME, clickCookieOptions);
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
