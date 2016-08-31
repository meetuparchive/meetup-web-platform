import {
	MOCK_GROUP,
	MOCK_EVENT,
} from './api';

export const MOCK_APP_STATE = {
	app: {
		self: {
			type: 'member',
			value: { id: 1234 }
		},
		group: {
			type: 'group',
			value: MOCK_GROUP
		},
		events: {
			type: 'event',
			value: [
				{ ...MOCK_EVENT, ...({ id: 3456 }) },
				{ ...MOCK_EVENT, ...({ id: 4567 }) }
			]
		}
	},
	auth: {},
	config: {},
	routing: {
		locationBeforeTransitions: {}
	},
};

export const MOCK_ROUTES = {
	path: '/',
	component: {},
	query: () => {}
};

export const MOCK_API_PROBLEM = {
	problem: 'There was an internal problem in the API'
};

export const MOCK_API_RESULT = [{
	ref: 'group',
	type: 'group',
	value: MOCK_APP_STATE.app.group.value
}];

export const MOCK_RENDERPROPS = {
	location: {  // https://github.com/reactjs/history/blob/master/docs/Location.md
		pathname: '/foo',
		search: '',
		state: {},
		action: 'PUSH',
		key: '1234'
	},
	params: {
		urlname: 'foo'
	}
};

export const mockQuery = ({ location, params }) => {
	return {
		type: 'group',
		params: params,
		ref: 'group'
	};
};

export const mockQueryBadType = ({ location, params }) => {
	const type = 'lkajlhsdhljaskliub';
	return { ...mockQuery({ location, params }), type };
};

export const MOCK_AUTH_HEADER = 'Bearer abcdefg';
export const MOCK_DATETIME = new Date().getTime();
export const MOCK_CREDENTIALS = {
	username: 'Michael McGahan',
	pw: 'whatever'
};

export const MOCK_POST_ACTION = {
	type: 'POST_DUMMY',
	payload: {
		query: {},
		onSuccess: result => ({ type: 'MOCK_SUCCESS' }),
		onError: err => ({ type: 'MOCK_ERROR' }),
	}
};
