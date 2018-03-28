import { MOCK_POST_ACTION, MOCK_DELETE_ACTION } from 'meetup-web-mocks/lib/app';

import { postEpic, deleteEpic } from './';
import * as api from '../sync/apiActionCreators';

describe('postEpic', () => {
	it('does not pass through arbitrary actions', () =>
		postEpic({ type: 'asdf' }).then(actions => expect(actions).toHaveLength(0)));
	it('returns an api.post(query) action', () => {
		return postEpic(MOCK_POST_ACTION).then(([action]) => {
			const { query, onSuccess, onError } = MOCK_POST_ACTION.payload;
			const expectedAction = api.post(query, { onSuccess, onError });
			// make the expected functions generic
			expectedAction.meta.request = expect.any(Promise);
			expectedAction.meta.resolve = expect.any(Function);
			expectedAction.meta.reject = expect.any(Function);
			expect(action).toMatchObject(expectedAction);
		});
	});
});

describe('deleteEpic', () => {
	it('does not pass through arbitrary actions', () =>
		deleteEpic({ type: 'asdf' }).then(actions =>
			expect(actions).toHaveLength(0)
		));
	it('returns an api.del(query) action', () => {
		return deleteEpic(MOCK_DELETE_ACTION).then(([action]) => {
			const { query, onSuccess, onError } = MOCK_DELETE_ACTION.payload;
			const expectedAction = api.del(query, { onSuccess, onError });
			// make the expected functions generic
			expectedAction.meta.request = expect.any(Promise);
			expectedAction.meta.resolve = expect.any(Function);
			expectedAction.meta.reject = expect.any(Function);
			expect(action).toMatchObject(expectedAction);
		});
	});
});
