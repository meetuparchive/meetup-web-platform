import { testCreateStore } from '../util/testUtils';
import { getServerCreateStore } from './';

const MOCK_ROUTES = {};
const MOCK_HAPI_REQUEST = {
	state: {},
	server: { app: { logger: { error: jest.fn() } } },
};

describe('getServerCreateStore', () => {
	testCreateStore(getServerCreateStore(MOCK_ROUTES, [], MOCK_HAPI_REQUEST));
});
