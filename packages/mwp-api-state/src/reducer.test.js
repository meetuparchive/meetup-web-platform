import { LOCATION_CHANGE } from 'mwp-router';
import {
	DEFAULT_API_STATE,
	DEFAULT_APP_STATE, // DEPRECATED
	api,
	filterKeys,
	getListState,
	app, // DEPRECATED
} from './reducer';
import { apiRequest } from './sync/syncActionCreators';
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
		expect(getListState(state, resp)).toEqual({
			[resp.query.list.dynamicRef]: resp.response,
		});
	});
	it('merges new response with existing dynamicRef, sorted', () => {
		const value = ['qux'];
		expect(
			getListState({ [resp.query.list.dynamicRef]: { value } }, resp)
		).toEqual({
			[resp.query.list.dynamicRef]: {
				value: [...value, ...resp.response.value].sort(
					resp.query.list.merge.sort
				),
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
		expect(
			getListState({ [resp.query.list.dynamicRef]: { value: list } }, response)
		).toEqual({
			[resp.query.list.dynamicRef]: {
				value: [...value.value, ...response.response.value.value].sort(
					resp.query.list.merge.sort
				),
			},
		});
	});
});

describe('app reducer', () => {
	beforeEach(function() {
		this.MOCK_STATE = { foo: 'bar' };
	});
	it('returns default state for empty action', () => {
		expect(app(undefined, {})).toEqual(DEFAULT_APP_STATE);
	});
	it('re-sets app state on logout API_REQUEST', function() {
		const logoutRequest = apiRequest([], {
			logout: true,
		});
		expect(app(this.MOCK_STATE, logoutRequest)).toEqual(DEFAULT_APP_STATE);
	});
	it('assembles success responses into single state tree', () => {
		const API_SUCCESS = {
			type: 'API_SUCCESS',
			payload: {
				responses: [{ foo: 'bar' }, { bar: 'baz' }, { baz: 'foo' }],
			},
		};
		expect(app(undefined, API_SUCCESS)).toEqual({
			foo: 'bar',
			bar: 'baz',
			baz: 'foo',
		});
	});
	it('populates an `error` key on API_ERROR', () => {
		const API_ERROR = {
			type: 'API_ERROR',
			payload: new Error('this is the worst'),
		};
		const errorState = app(undefined, API_ERROR);
		expect(errorState.error).toBe(API_ERROR.payload);
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
