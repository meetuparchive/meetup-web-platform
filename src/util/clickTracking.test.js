import * as clickTracking from './clickTracking';

describe('trackStopPropagation', () => {
	it('adds Event.prototype.stopPropAndTrack', () => {
		clickTracking.trackStopPropagation(() => {});
		expect(Event.prototype.stopPropAndTrack).toBeDefined();
	});
	it('overrides Event.prototype.stopPropagation', () => {
		clickTracking.trackStopPropagation(() => {});
	});
	it('calls supplied event handler on stopPropagation', () => {
		const spyable = {
			dummyListener() {}
		};
		spyOn(spyable, 'dummyListener');
		clickTracking.trackStopPropagation(spyable.dummyListener);
		const evt = document.createEvent('HTMLEvents');
		evt.initEvent('click', false, true);
		document.body.dispatchEvent(evt);
		evt.stopPropagation();
		expect(spyable.dummyListener).toHaveBeenCalled();
	});
	describe('stopPropAndTrack', () => {
		it('calls trackClick', () => {
			const spyable = {
				dummyListener() {}
			};
			spyOn(spyable, 'dummyListener');
			clickTracking.trackStopPropagation(spyable.dummyListener);
			const evt = document.createEvent('HTMLEvents');
			evt.initEvent('click', false, true);
			document.body.dispatchEvent(evt);
			evt.stopPropAndTrack();
			expect(spyable.dummyListener).toHaveBeenCalled();
		});
	});
});

