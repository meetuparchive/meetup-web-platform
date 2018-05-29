import * as api from './apiActionCreators';

describe('method-specific creators', () => {
	it('populates the correct query.meta.method property', () => {
		const methodMap = {
			get: 'get',
			patch: 'patch',
			post: 'post',
			del: 'delete',
		};
		Object.keys(methodMap).forEach(key => {
			const query = {};
			const expectedQuery = { meta: { method: methodMap[key] } };
			const requestAction = api[key](query);
			expect(requestAction.type).toBe('API_REQ');
			expect(requestAction.payload).toHaveLength(1);
			expect(requestAction.payload[0]).toMatchObject(expectedQuery);
			expect(requestAction.meta.request).toEqual(expect.any(Promise));
			expect(requestAction.meta.resolve).toEqual(expect.any(Function));
			expect(requestAction.meta.reject).toEqual(expect.any(Function));
		});
	});
	it('track sets endpoint, meta.method, adds requestMeta.clickTracking.true', () => {
		const query = {};
		const trackAction = api.track(query);
		expect(trackAction.type).toBe('API_REQ');
		expect(trackAction.payload).toHaveLength(1);
		expect(trackAction.payload[0]).toMatchObject({
			endpoint: 'track',
			meta: {
				method: 'post',
			},
		});
		expect(trackAction.meta.clickTracking).toBe(true);
	});
});
