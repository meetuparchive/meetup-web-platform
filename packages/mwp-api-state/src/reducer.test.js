import { LOCATION_CHANGE } from 'mwp-router';
import { DEFAULT_API_STATE, api, filterKeys, getListState } from './reducer';
import * as apiActions from './sync/apiActionCreators';

describe('getListState', () => {
	const state = {};
	const resp = {
		response: { value: ['foo'] },
		query: {
			ref: 'bar',
			list: {
				dynamicRef: 'baz',
				merge: {
					idTest: () => false,
					sort: (a, b) => {
						if (a > b) {
							return 1;
						}
						if (a < b) {
							return -1;
						}
						return 0;
					},
				},
			},
		},
	};
	const respWithoutSort = {
		response: { value: ['foo'] },
		query: {
			ref: 'bar',
			list: {
				dynamicRef: 'baz',
				merge: {
					idTest: () => false,
				},
			},
		},
	};
	const respWithReverse = {
		response: { value: ['foo'] },
		query: {
			ref: 'bar',
			list: {
				dynamicRef: 'baz',
				merge: {
					idTest: () => false,
					isReverse: true,
				},
			},
		},
	};
	it('ignores no-response responses', () => {
		expect(
			getListState(state, {
				response: null,
				query: resp.query,
			})
		).toEqual({});
	});
	it('ignores no-list queries', () => {
		expect(
			getListState(state, {
				response: resp.response,
				query: { ref: 'bar' },
			})
		).toEqual({});
	});
	it('returns a new object with dynamicRef', () => {
		const ref = resp.query.list.dynamicRef;
		expect(getListState(state, resp)).toEqual({
			[ref]: {
				value: resp.response.value,
				query: resp.query,
			},
		});
	});
	it('merges new response with existing dynamicRef, sorted', () => {
		const value = ['qux'];
		const ref = resp.query.list.dynamicRef;
		expect(getListState({ [ref]: { value } }, resp)).toEqual({
			[ref]: {
				value: [...value, ...resp.response.value].sort(
					resp.query.list.merge.sort
				),
				query: resp.query,
			},
		});
	});
	it('merges new response with existing dynamicRef, not sorted if sort callback undefined', () => {
		const value = ['qux'];
		const ref = respWithoutSort.query.list.dynamicRef;
		expect(getListState({ [ref]: { value } }, respWithoutSort)).toEqual({
			[ref]: {
				value: [...value, ...respWithoutSort.response.value],
				query: respWithoutSort.query,
			},
		});
	});
	it('merges new response with existing dynamicRef adding new items at the top of the list', () => {
		const value = ['qux'];
		const ref = respWithReverse.query.list.dynamicRef;
		expect(getListState({ [ref]: { value } }, respWithReverse)).toEqual({
			[ref]: {
				value: [...respWithReverse.response.value, ...value],
				query: respWithReverse.query,
			},
		});
	});
	it('merges new response with existing dynamicRef, sorted in case list is not top level value (is under `value` filed)', () => {
		const list = ['qux'];
		const value = { value: list };
		const response = {
			response: { value: { value: ['foo'] } },
			query: resp.query,
		};
		const ref = response.query.list.dynamicRef;
		expect(getListState({ [ref]: { value: list } }, response)).toEqual({
			[ref]: {
				value: [...value.value, ...response.response.value.value].sort(
					response.query.list.merge.sort
				),
				query: response.query,
			},
		});
	});
});

describe('api reducer', () => {
	it('returns default state for empty action', () => {
		expect(api({ ...DEFAULT_API_STATE }, {})).toEqual(DEFAULT_API_STATE);
	});
	it('re-sets api state on logout API_REQ, with inFlight query', function() {
		const ref = 'foobar';
		const logoutRequest = apiActions.get([{ ref }], {
			logout: true,
		});
		expect(api({ ...DEFAULT_API_STATE }, logoutRequest)).toEqual({
			...DEFAULT_API_STATE,
			inFlight: [ref],
		});
	});
	it('clears refs corresponding to non-GET queries', () => {
		const bar = {
			query: {
				meta: {
					method: 'post',
				},
			},
		};
		const baz = {
			query: {
				meta: {
					method: 'get',
				},
			},
		};
		const populatedState = {
			...DEFAULT_API_STATE,
			bar,
			baz,
		};
		const action = { type: LOCATION_CHANGE };
		expect(api(populatedState, action)).toEqual({ ...DEFAULT_API_STATE, baz });
	});
	it('clears refs corresponding to new requests', function() {
		const ref = 'foobar';
		const populatedState = {
			...DEFAULT_API_STATE,
			bar: 'something unrelated',
		};
		const populatedStateWithRef = {
			...populatedState,
			[ref]: 'not empty',
		};
		const action = apiActions.get([{ ref }]);
		expect(api(populatedStateWithRef, action)).toEqual({
			...populatedState,
			inFlight: [ref],
		});
	});
	it('adds success response to state tree', () => {
		const resp = {
			response: { ref: 'bing', value: 'baz' },
			query: { ref: 'bing' },
		};
		const API_RESP_SUCCESS = apiActions.success(resp);
		expect(
			api({ ...DEFAULT_API_STATE, foo: 'bar' }, API_RESP_SUCCESS)
		).toEqual({
			foo: 'bar',
			bing: { ref: 'bing', value: 'baz', query: resp.query },
			inFlight: [],
		});
	});
	it('adds error response to state tree', () => {
		const resp = {
			response: { ref: 'bing', error: 'baz' },
			query: { ref: 'bing' },
		};
		const API_RESP_ERROR = apiActions.error(resp);
		expect(api({ ...DEFAULT_API_STATE, foo: 'bar' }, API_RESP_ERROR)).toEqual({
			foo: 'bar',
			bing: { ref: 'bing', error: 'baz', query: resp.query },
			inFlight: [],
		});
	});
	it('populates an `fail` key on API_RESP_FAIL', () => {
		const API_RESP_FAIL = apiActions.fail(new Error('this is the worst'));
		const errorState = api({ ...DEFAULT_API_STATE }, API_RESP_FAIL);
		expect(errorState).toEqual(
			expect.objectContaining({ fail: API_RESP_FAIL.payload })
		);
	});
	it('adds query ref to inFlight array on API_REQ', () => {
		const ref = 'foobar';
		const API_REQ = apiActions.get([{ ref }]);
		const apiState = api({ ...DEFAULT_API_STATE }, API_REQ);
		expect(apiState).toMatchObject({ inFlight: [ref] });
	});
	it('removes query refs from inFlight array on API_RESP_COMPLETE', () => {
		const ref1 = 'foobar';
		const ref2 = 'barfoo';
		const query1 = { ref: ref1 };
		const query2 = { ref: ref2 };

		const inFlightState = [ref1, ref2, 'asdf'];
		const expectedInFlightState = ['asdf'];
		const completeAction = apiActions.complete([query1, query2]);

		const apiState = api(
			{ ...DEFAULT_API_STATE, inFlight: inFlightState },
			completeAction
		);
		expect(apiState).toMatchObject({ inFlight: expectedInFlightState });
	});
});
describe('filterKeys', () => {
	it('returns an object with all specified keys removed', () => {
		const orig = { foo: 'bar', baz: 'qux', so: 'what' };
		expect(filterKeys(orig, [], ['foo', 'so'])).toEqual({ baz: 'qux' });
	});
	it('does not remove whitelisted keys when specified', () => {
		const orig = { foo: 'bar', baz: 'qux', so: 'what' };
		expect(filterKeys(orig, ['foo'], ['foo', 'so'])).toEqual({
			foo: 'bar',
			baz: 'qux',
		});
	});
});
