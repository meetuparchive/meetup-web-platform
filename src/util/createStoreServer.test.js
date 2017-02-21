import url from 'url';
import * as fetchUtils from './fetchUtils';
import {
	testCreateStore
} from './createStore.test';
import {
	getServerCreateStore,
	serverFetchQueries,
} from './createStoreServer';

const MOCK_ROUTES = {};
const MOCK_HAPI_REQUEST = {
	state: {}
};

const serverRequest = {
	state: {
		__internal_foo: 'bar',
		bar: 'baz',  // ignored because it doesn't start with __internal_
	},
	url: url.parse('http://example.com'),
	raw: {
		req: {
			headers: {
				cookie: 'foo=bar',
			},
		},
	},
};


describe('getServerCreateStore', () => {
	testCreateStore(getServerCreateStore(MOCK_ROUTES, [], MOCK_HAPI_REQUEST));
});

describe('serverFetchQueries', () => {
});

