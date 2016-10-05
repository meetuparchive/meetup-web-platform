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
	it('sets and gets from cache', function(done) {
		const cache = makeCache();
		cache.set('foo', 'bar');
		cache.get('foo')
			.then(value => expect(value).toEqual('bar'))
			.then(() => {
				cache.set('foo', 'baz');
				cache.get('foo')
					.then(value => expect(value).toEqual('baz'))
					.then(done);
			});
	});
	it('deletes from cache', function(done) {
		const cache = makeCache();
		cache.set('foo', 'bar');
		cache.delete('foo');
		cache.get('foo')
			.then(value => expect(value).toBeUndefined())
			.catch(err => expect(err).toEqual(jasmine.any(Error)))
			.then(done);
	});

	it('cacheWriter writes to cache', function(done) {
		const cache = makeCache();
		const query = { foo: 'baz' };
		const response = 'bar';
		cacheWriter(cache)(query, response)
			.then(() => cache.get(JSON.stringify(query)))
			.then(cachedResponse => expect(cachedResponse).toEqual(response))
			.then(done);
	});

	it('cacheReader reads from cache and returns result with query', function(done) {
		const cache = makeCache();
		const requestCache = cacheReader(cache);
		const query = { foo: 'baz' };
		const nonCachedQuery = { bing: 'bong' };
		const response = 'bar';
		cacheWriter(cache)(query, response)
			.then(() => requestCache(query))
			.then(([ cachedQuery, cachedResponse ]) => {  // expecting two-element array response
				expect(cachedQuery).toEqual(query);
				expect(cachedResponse).toEqual(response);
			})
			.then(() => requestCache(nonCachedQuery))  // test with un-cached query
			.then(([ cachedQuery, cachedResponse ]) => {
				expect(cachedQuery).toEqual(nonCachedQuery);
				expect(cachedResponse).toBeNull();
			})
			.then(done);
	});
});
