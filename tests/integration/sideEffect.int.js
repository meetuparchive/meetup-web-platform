import Helmet from 'react-helmet';
import { getMockRenderRequestMap } from '../mocks';
import start from '../../src/app-server';
import { Forbidden, NotFound, Redirect } from '../../src/router';

Forbidden.rewind = jest.fn(Forbidden.rewind);
NotFound.rewind = jest.fn(NotFound.rewind);
Redirect.rewind = jest.fn(Redirect.rewind);
Helmet.rewind = jest.fn(Helmet.rewind);

const testSideEffectError = (Component, name) =>
	start(getMockRenderRequestMap(), {}).then(server => {
		const request = {
			method: 'get',
			url: `/badImplementation?${name}`,
			credentials: 'whatever',
		};
		return server
			.inject(request)
			.then(response => {
				expect(response.statusCode === 500);
				expect(Component.rewind).toHaveBeenCalled();
			})
			.then(() => server.stop())
			.catch(err => {
				server.stop();
				throw err;
			});
	});

describe('rewind behavior', () => {
	it('rewind() for all side effect components for normal server render', () =>
		start(getMockRenderRequestMap(), {}).then(server => {
			const request = {
				method: 'get',
				url: '/foo',
				credentials: 'whatever',
			};
			return server
				.inject(request)
				.then(() => {
					expect(Forbidden.rewind).toHaveBeenCalled();
					expect(NotFound.rewind).toHaveBeenCalled();
					expect(Redirect.rewind).toHaveBeenCalled();
					expect(Helmet.rewind).toHaveBeenCalled();
				})
				.then(() => server.stop())
				.catch(err => {
					server.stop();
					throw err;
				});
		}));
	it('calls Helmet.rewind when Helmet is called with invalid content', () =>
		testSideEffectError(Helmet, 'helmet'));
	it('calls Forbidden.rewind when Forbidden is called with invalid content', () =>
		testSideEffectError(Forbidden, 'forbidden'));
	it('calls Redirect.rewind when Redirect is called with invalid content', () =>
		testSideEffectError(Redirect, 'redirect'));
	it('calls NotFound.rewind when NotFound is called with invalid content', () =>
		testSideEffectError(NotFound, 'notfound'));
});
