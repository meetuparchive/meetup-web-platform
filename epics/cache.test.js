import 'rxjs/Observable';
import { ActionsObservable } from 'redux-observable';
import {
	mockQuery,
	MOCK_RENDERPROPS,
	MOCK_API_RESULT,
} from '../util/mocks/app';
import * as syncActionCreators from '../actions/syncActionCreators';
import * as cacheActionCreators from '../actions/cacheActionCreators';
import CacheEpic, * as cacheExports from './cache';

describe('CacheEpic', () => {
	beforeEach(function() {
		this.MOCK_QUERY = mockQuery(MOCK_RENDERPROPS);
		this.apiSuccessAction = syncActionCreators.apiSuccess({
			queries: [this.MOCK_QUERY],
			responses: MOCK_API_RESULT
		});
	});
	it('does not pass through arbitrary actions', function(done) {
		const arbitraryAction = {
			type: 'ARBITRARY',
			payload: '/'  // root location/path will query for member
		};
		const action$ = ActionsObservable.of(arbitraryAction);
		const epic$ = CacheEpic(action$);
		const spyable = {
			notCalled: () => {}
		};
		spyOn(spyable, 'notCalled');
		epic$.subscribe(
			spyable.notCalled,
			null,
			() => {
				expect(spyable.notCalled).not.toHaveBeenCalled();
				done();
			}
		);
	});
});

