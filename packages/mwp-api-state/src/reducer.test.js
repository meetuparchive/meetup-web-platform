import {
	DEFAULT_API_STATE,
	DEFAULT_APP_STATE, // DEPRECATED
	api,
	app, // DEPRECATED
} from './reducer';
import { apiRequest } from './sync/syncActionCreators';
import * as apiActions from './sync/apiActionCreators';

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
		const logoutRequest = apiActions.requestAll([{ ref }], {
			logout: true,
		});
		expect(api({ ...DEFAULT_API_STATE }, logoutRequest)).toEqual({
			...DEFAULT_API_STATE,
			inFlight: [ref],
		});
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
		const action = apiActions.requestAll([{ ref }]);
		expect(api(populatedStateWithRef, action)).toEqual({
			...populatedState,
			inFlight: [ref],
		});
	});
	it('adds success response to state tree', () => {
		const API_RESP_SUCCESS = apiActions.success({
			query: {},
			response: { ref: 'bing', value: 'baz' },
		});
		expect(
			api({ ...DEFAULT_API_STATE, foo: 'bar' }, API_RESP_SUCCESS)
		).toEqual({
			foo: 'bar',
			bing: { ref: 'bing', value: 'baz' },
			inFlight: [],
		});
	});
	it('adds error response to state tree', () => {
		const API_RESP_ERROR = apiActions.error({
			response: { ref: 'bing', error: 'baz' },
		});
		expect(api({ ...DEFAULT_API_STATE, foo: 'bar' }, API_RESP_ERROR)).toEqual({
			foo: 'bar',
			bing: { ref: 'bing', error: 'baz' },
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
		const API_REQ = apiActions.requestAll([{ ref }]);
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
