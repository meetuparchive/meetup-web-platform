import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';

import { ActionsObservable } from 'redux-observable';
import {
	MOCK_MEANINGLESS_ACTION,
	MOCK_APP_STATE,
} from 'meetup-web-mocks/lib/app';
import { createFakeStore } from 'mwp-test-utils';

export const epicIgnoreAction = (
	epic,
	action = MOCK_MEANINGLESS_ACTION,
	store = createFakeStore(MOCK_APP_STATE)
) => () => {
	const spyable = {
		notCalled: () => {},
	};
	spyOn(spyable, 'notCalled');
	const action$ = ActionsObservable.of(action);
	return epic(action$, store)
		.do(
			spyable.notCalled,
			null,
			expect(spyable.notCalled).not.toHaveBeenCalled()
		)
		.toPromise();
};
