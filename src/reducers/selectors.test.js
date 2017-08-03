import { generateMockState } from '../util/testUtils';
import { MOCK_EVENT } from 'meetup-web-mocks/lib/api';
import {
	EMPTY_OBJ,
	EMPTY_ARR,
	isEmpty,
	hasErrors,
	hasValidValue,
	getValue,
	getProperty,
	getSelectOrFallback,
	getInFlight,
	getResponse,
} from './selectors';

describe('Selector Helpers', () => {
	describe('isEmpty', () => {
		it('should be `false` if valid object provided', () => {
			const processed = isEmpty({ value: '222' });
			expect(processed).toBe(false);
		});
		it('should be `false` if error object provided', () => {
			const processed = isEmpty({ error: 'Bad' });
			expect(processed).toBe(false);
		});
		it('should be `true` if empty object provided', () => {
			const processed = isEmpty({});
			expect(processed).toBe(true);
		});
		it('should be `true` if nothing provided', () => {
			const processed = isEmpty();
			expect(processed).toBe(true);
		});
	});
	describe('hasErrors', () => {
		it('should be `false` if valid object provided', () => {
			const processed = hasErrors({ value: '222' });
			expect(processed).toBe(false);
		});
		it('should be `false` if empty object provided', () => {
			const processed = hasErrors({});
			expect(processed).toBe(false);
		});
		it('should be `false` if nothing provided', () => {
			const processed = hasErrors();
			expect(processed).toBe(false);
		});
		it('should be `true` if error object provided', () => {
			const processed = hasErrors({ error: 'Bad' });
			expect(processed).toBe(true);
		});
	});
	describe('hasValidValue', () => {
		it('should be `false` if empty object provided', () => {
			const processed = hasValidValue({});
			expect(processed).toBe(false);
		});
		it('should be `false` if nothing provided', () => {
			const processed = hasValidValue();
			expect(processed).toBe(false);
		});
		it('should be `false` if error object provided', () => {
			const processed = hasValidValue({ error: 'Bad' });
			expect(processed).toBe(false);
		});
		it('should be `true` if valid object provided', () => {
			const processed = hasValidValue({ value: '222' });
			expect(processed).toBe(true);
		});
	});
	describe('getValue', () => {
		it('should return default object if invalid value', () => {
			const processed = getValue({});
			expect(processed).toBe(EMPTY_OBJ);
		});
		it('should return default object if invalid value', () => {
			const processed = getValue();
			expect(processed).toBe(EMPTY_OBJ);
		});
		it('should return error object if invalid value', () => {
			const error = { error: 'Bad' };
			const processed = getValue(error);
			expect(processed).toMatchObject(error);
		});
		it('should return value object if valid object', () => {
			const processed = getValue({ value: '222' });
			expect(processed).toBe('222');
		});
	});
	describe('getProperty', () => {
		it('should return default object if invalid value', () => {
			const processed = getProperty({});
			expect(processed).toBe(EMPTY_OBJ);
		});
		it('should return default object if invalid prop', () => {
			const processed = getProperty({}, 'id', '');
			expect(processed).toBe('');
		});
		it('should return error object if invalid value', () => {
			const error = { error: 'Bad' };
			const processed = getProperty(error, 'id', '');
			expect(processed).toMatchObject(error);
		});
		it('should return value object if valid object', () => {
			const id = '222';
			const processed = getProperty({ value: { id } }, 'id', '');
			expect(processed).toBe(id);
		});
	});
	describe('getSelectOrFallback', () => {
		const fallback = '111';
		it('should return default object if invalid value', () => {
			const processed = getSelectOrFallback(fallback, () => {})({});
			expect(processed).toBe(fallback);
		});
		it('should return default object if invalid value', () => {
			const value = '222';
			const state = { value };
			const processed = getSelectOrFallback(fallback, state => state.value)(
				state
			);
			expect(processed).toBe(value);
		});
	});
	describe('getInFlight', () => {
		it('should return inFlight from state object', () => {
			const mock_state = generateMockState('inFlight');
			const newState = getInFlight(mock_state);
			expect(newState).toMatchObject(mock_state.api.inFlight);
		});
		it('should return default value of error response', () => {
			const newState = getInFlight({ api: {} });
			expect(newState).toBe(EMPTY_ARR);
		});
	});
	describe('getResponse', () => {
		it('should return empty object if event is empty', () => {
			const proccessedObj = getResponse();
			expect(proccessedObj).toEqual(EMPTY_OBJ);
		});
		it('should return default object if event is empty', () => {
			const proccessedObj = getResponse({}, null, 'default');
			expect(proccessedObj).toEqual('default');
		});
		it('should return error object if resp has error', () => {
			const type = 'ACTION';
			const message = { error: 'Bad Response 🎃' };
			const proccessedObj = getResponse(message, type);
			const expected = {
				error: {
					type,
					message: message.error,
				},
			};
			expect(proccessedObj).toEqual(expected);
		});
		it('should return resp.value if resp is valid', () => {
			const resp = {
				value: MOCK_EVENT,
			};
			const proccessedObj = getResponse(resp);
			expect(proccessedObj).toEqual(MOCK_EVENT);
		});
	});
});
