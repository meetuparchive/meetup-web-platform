import 'rxjs/Observable';
import { ActionsObservable } from 'redux-observable';
import {
	mockQuery,
	MOCK_RENDERPROPS,
	MOCK_API_RESULT,
} from '../util/mocks/app';
import * as syncActionCreators from '../actions/syncActionCreators';
import CacheEpic, { cache } from './cache';
import {
	makeCache,
	cacheReader,
	cacheWriter,
} from '../util/cacheUtils';

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

	it('does not emit cacheSuccess when no hit from API_REQUEST', function(done) {
		const action$ = ActionsObservable.of(syncActionCreators.apiRequest([this.MOCK_QUERY]));
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

	it('emits cacheSuccess when there is a cache hit for API_REQUEST', function(done) {
		const action$ = ActionsObservable.of(
			this.apiSuccessAction,
			syncActionCreators.apiRequest([this.MOCK_QUERY])
		);
		const epic$ = CacheEpic(action$);

		const spyable = {
			called: () => {}
		};
		spyOn(spyable, 'called');
		epic$.subscribe(
			spyable.called,
			null,
			() => {
				expect(spyable.called).toHaveBeenCalled();
				done();
			}
		);
	});
	it('does not emit cacheSuccess after CACHE_CLEAR is dispatched', function(done) {
		const spyable = {
			called: x => { console.log(x); }
		};
		spyOn(spyable, 'called').and.callThrough();

		// set the cache with API_SUCCESS
		const action$ = ActionsObservable.of(this.apiSuccessAction);
		const epic$ = CacheEpic(action$);
		epic$.subscribe();

		// clear the cache with CACHE_CLEAR
		const clearAction$ = ActionsObservable.of({ type: 'CACHE_CLEAR' });
		const clearingEpic$ = CacheEpic(clearAction$);
		clearingEpic$.subscribe();

		// try to read from teh cache
		const requestAction$ = ActionsObservable.of(syncActionCreators.apiRequest([this.MOCK_QUERY]));
		const clearedEpic$ = CacheEpic(requestAction$);
		clearedEpic$.subscribe(
			spyable.called,
			null,
			() => {
				expect(spyable.called).not.toHaveBeenCalled();
				done();
			}
		);

	});
	it('calls writeCache on API_SUCCESS', function(done) {
		// set up a fresh dispatcher and apiSuccessAction that will use the faked
		// checkEnable function
		const action$ = ActionsObservable.of(this.apiSuccessAction);
		const epic$ = CacheEpic(action$);

		epic$.subscribe(
			null,
			null,
			() => {
				done();
			}
		);
	});
	xit('does not call cacheSet or cacheRequest when disabled', () => {
	});
});

