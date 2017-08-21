import { ActionsObservable } from 'redux-observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/toPromise';

import { MOCK_POST_ACTION, MOCK_DELETE_ACTION } from 'meetup-web-mocks/lib/app';

import { epicIgnoreAction } from '../../util/testUtils';

import { postEpic, deleteEpic } from './';
import * as api from '../sync/apiActionCreators';

describe('postEpic', () => {
	it('does not pass through arbitrary actions', epicIgnoreAction(postEpic));
	it('returns an api.post(query) action', () => {
		const action$ = ActionsObservable.of(MOCK_POST_ACTION);
		return postEpic(action$).toPromise().then(action => {
			const { query, onSuccess, onError } = MOCK_POST_ACTION.payload;
			const expectedAction = api.del(query, { onSuccess, onError });
			// make the expected functions generic
			expectedAction.meta.request = expect.any(Promise);
			expectedAction.meta.resolve = expect.any(Function);
			expectedAction.meta.reject = expect.any(Function);
			expect(action).toMatchObject(expectedAction);
		});
	});
});

describe('deleteEpic', () => {
	it('does not pass through arbitrary actions', epicIgnoreAction(deleteEpic));
	it('returns an api.del(query) action', () => {
		const action$ = ActionsObservable.of(MOCK_DELETE_ACTION);
		return deleteEpic(action$).toPromise().then(action => {
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
