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
		});
	});
});
