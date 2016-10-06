import {
	makeCache,
	cacheWriter,
	cacheReader,
} from '../util/cacheUtils';

describe('cache utils', () => {
	it('creates a Promise-based cache', function() {
		const cache = makeCache();
		expect(cache.get).toEqual(jasmine.any(Function));
		expect(cache.get()).toEqual(jasmine.any(Promise));
		expect(cache.set).toEqual(jasmine.any(Function));
		expect(cache.set()).toEqual(jasmine.any(Promise));
		expect(cache.delete).toEqual(jasmine.any(Function));
		expect(cache.delete()).toEqual(jasmine.any(Promise));
	});
	it('sets and gets from cache', function() {
		const cache = makeCache();
		return cache.set('foo', 'bar')
			.then(() => cache.get('foo'))
			.then(value => expect(value).toEqual('bar'))
			.then(() => cache.set('foo', 'baz'))
			.then(() => cache.get('foo'))
			.then(value => expect(value).toEqual('baz'));
	});
	it('deletes from cache', function() {
		const cache = makeCache();
		return cache.set('foo', 'bar')
			.then(() => cache.delete('foo'))
			.then(() => cache.get('foo'))
			.then(value => expect(value).toBeUndefined())
			.catch(err => expect(err).toEqual(jasmine.any(Error)));
	});

	it('cacheWriter writes to cache', function() {
		const cache = makeCache();
		const query = { foo: 'baz' };
		const response = 'bar';
		return cacheWriter(cache)(query, response)
			.then(() => cache.get(JSON.stringify(query)))
			.then(cachedResponse => expect(cachedResponse).toEqual(response));
	});

	it('cacheReader reads from cache and returns result with query', function() {
		const cache = makeCache();
		const requestCache = cacheReader(cache);
		const query = { foo: 'baz' };
		const nonCachedQuery = { bing: 'bong' };
		const response = 'bar';
		return cacheWriter(cache)(query, response)
			.then(() => requestCache(query))
			.then(([ cachedQuery, cachedResponse ]) => {  // expecting two-element array response
				expect(cachedQuery).toEqual(query);
				expect(cachedResponse).toEqual(response);
			})
			.then(() => requestCache(nonCachedQuery))  // test with un-cached query
			.then(([ cachedQuery, cachedResponse ]) => {
				expect(cachedQuery).toEqual(nonCachedQuery);
				expect(cachedResponse).toBeUndefined();
			});
	});
});
