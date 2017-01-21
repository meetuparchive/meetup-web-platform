import getTrackClick, * as clickTracking from './clickTracking';
describe('trackStopPropagation', () => {
	it('adds Event.prototype.stopPropAndTrack', () => {
		const spyable = {
			dummyListener() {}
		};
		spyOn(spyable, 'dummyListener');
		clickTracking.trackStopPropagation(spyable.dummyListener);
		expect(Event.prototype.stopPropAndTrack).toBeDefined();
	});
	it('overrides Event.prototype.stopPropagation', () => {
		expect(Event.prototype.stopPropAndTrack).not.toBeDefined();
	});
	describe('stopPropAndTrack', () => {
		it('calls trackClick', () => {
		});
	});
	describe('stopPropagation', () => {
		it('calls stopPropAndTrack for click events', () => {
		});
	});
});

describe('getTrackClick', () => {
	it('calls trackStopPropagation', () => {
		getTrackClick();
	});
});

