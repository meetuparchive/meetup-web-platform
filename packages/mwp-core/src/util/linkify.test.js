import linkify from './linkify';

describe('linkify', () => {
	const httpBase = 'http://www.meetup.com',
		expectedLink =
			'<a class="link" href="http://www.meetup.com" title="http://www.meetup.com" target="" >http://www.meetup.com</a>';

	it('should turn a link text with http into a HTML anchor with http', () => {
		expect(linkify(httpBase)).toBe(expectedLink);
	});
	it('should turn a link text with https into a HTML anchor with https', () => {
		const secureBase = 'https://secure.meetup.com';
		const expectedSecureLink =
			'<a class="link" href="https://secure.meetup.com" title="https://secure.meetup.com" target="" >https://secure.meetup.com</a>';
		expect(linkify(secureBase)).toBe(expectedSecureLink);
	});
	it('should turn a link text with a target into an HTML anchor with a target', () => {
		const targetLink =
			'<a class="link" href="http://www.meetup.com" title="http://www.meetup.com" target="foo" >http://www.meetup.com</a>';
		expect(linkify(httpBase, { target: 'foo' })).toBe(targetLink);
	});
	it('should turn a link text with a `_blank` target into an HTML anchor with `rel="nofollow noopener noreferrer"`', () => {
		expect(linkify(httpBase, { target: '_blank' })).toContain(
			'rel="nofollow noopener noreferrer"'
		);
	});
	it('should turn a link text without a `_blank` target into an HTML anchor without `rel="nofollow noopener noreferrer"`', () => {
		expect(linkify(httpBase)).not.toContain('rel="nofollow noopener noreferrer"');
	});
	it('should not turn a text without a link into text with an HTML anchor', () => {
		const noLinkText = 'This is not a link.';
		expect(linkify(noLinkText)).toBe(noLinkText);
		expect(linkify(noLinkText)).not.toContain('</a>');
	});
	it('should turn a text with a link into text with an HTML anchor', () => {
		const paragraphTextBase = `Did you know ${httpBase} is a cool site?`;
		const expectedParagraphLink = `Did you know ${expectedLink} is a cool site?`;
		expect(linkify(paragraphTextBase)).toBe(expectedParagraphLink);
	});
	it('should prefix a plain link with a protocol', () => {
		const plainBase = 'www.meetup.com';
		const expectedLink =
			'<a class="link" href="http://www.meetup.com" title="www.meetup.com" target="" >www.meetup.com</a>';
		expect(linkify(plainBase)).toBe(expectedLink);
	});
});
describe('url matching', () => {
	// most of these test urls were copied from url-regex
	const urlsShouldMatch = [
		'http://foo.com/blah_blah',
		'http://foo.com/blah_blah/',
		'http://foo.com/blah_blah_(wikipedia)',
		'http://foo.com/blah_blah_(wikipedia)_(again)',
		'http://www.example.com/wpstyle/?p=364',
		'https://www.example.com/foo/?bar=baz&inga=42&quux',
		'http://a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.com',
		'http://mw1.google.com/mw-earth-vectordb/kml-samples/gp/seattle/gigapxl/$[level]/r$[y]_c$[x].jpg',
		'http://user:pass@example.com:123/one/two.three?q1=a1&q2=a2#body',
		'http://www.microsoft.xn--comindex-g03d.html.irongeek.com',
		'http://✪df.ws/123',
		'http://localhost/',
		'http://userid:password@example.com:8080',
		'http://userid:password@example.com:8080/',
		'http://userid@example.com',
		'http://userid@example.com/',
		'http://userid@example.com:8080',
		'http://userid@example.com:8080/',
		'http://userid:password@example.com',
		'http://userid:password@example.com/',
		'http://142.42.1.1/',
		'http://142.42.1.1:8080/',
		'http://➡.ws/䨹',
		'http://⌘.ws',
		'http://⌘.ws/',
		'http://foo.com/blah_(wikipedia)#cite-1',
		'http://foo.com/blah_(wikipedia)_blah#cite-1',
		'http://foo.com/unicode_(✪)_in_parens',
		'http://foo.com/(something)?after=parens',
		'http://☺.damowmow.com/',
		'http://code.google.com/events/#&product=browser',
		'http://j.mp',
		'ftp://foo.bar/baz',
		'http://foo.bar/?q=Test%20URL-encoded%20stuff',
		'http://مثال.إختبار',
		'http://例子.测试',
		'http://उदाहरण.परीक्षा',
		"http://-.~_!$&'()*+';=:%40:80%2f::::::@example.com",
		'http://1337.net',
		'http://a.b-c.de',
		'http://223.255.255.254',
		'http://example.com?foo=bar',
		'http://example.com#foo',
		'ws://localhost:8080',
		'ws://foo.ws',
		'ws://a.b-c.de',
		'ws://223.255.255.254',
		'ws://userid:password@example.com',
		'ws://➡.ws/䨹',
		'//localhost:8080',
		'//foo.ws',
		'//a.b-c.de',
		'//223.255.255.254',
		'//userid:password@example.com',
		'//➡.ws/䨹',
		'http://www.restaurant.com/menu(1).pdf',
		'http://www.restaurant.com/menu(foo)(bar).pdf',
		'http://www.example.com/menu(wikipedia)',
		'http://m.com/menu(1)new(2).pdf',
		'http://foo.com/(something)?after=parenthe',
	];
	const urlsShouldNotMatch = [
		'http://',
		'http://.',
		'http://..',
		'http://../',
		'http://?',
		'http://??',
		'http://??/',
		'http://#',
		'http://##',
		'http://##/',
		'//',
		'//a',
		'///a',
		'///',
		'http:///a',
		'foo.com',
		'rdar://1234',
		'h://test',
		'http:// shouldfail.com',
		':// should fail',
		'http://-error-.invalid/',
		'http://-a.b.co',
		'http://a.b-.co',
		'http://123.123.123',
		'http://3628126748',
		'http://go/ogle.com',
		'http://google\\.com',
		'http://www(google.com',
		'http://www=google.com',
		'rdar://1234',
		'/foo.bar/',
	];

	urlsShouldMatch.forEach(url => {
		it(`should match ${url}`, () => {
			const plainText = `Check out my meetup (${url}). It's awesome.`;
			const expected = `Check out my meetup (<a class="link" href="${url}" title="${url}" target="" >${url}</a>). It's awesome.`;
			expect(linkify(plainText)).toBe(expected);
		});
	});
	urlsShouldNotMatch.forEach(url => {
		it(`should not match ${url}`, () => {
			const plainText = `Check out my meetup (${url}). It's awesome.`;
			expect(linkify(plainText)).toBe(plainText);
		});
	});
});

describe('rel attribute', () => {
	it('should not render a rel attribute', () => {
		const expectedLink =
			'<a class="link" href="https://www.meetup.com" title="https://www.meetup.com" target="" >https://www.meetup.com</a>';
		expect(linkify('https://www.meetup.com', {}, ['youtube.com'])).toBe(
			expectedLink
		);
	});
	it('should render a "ugc" rel attribute', () => {
		const expectedLink =
			'<a class="link" href="https://www.youtube.com" title="https://www.youtube.com" target="" rel="ugc">https://www.youtube.com</a>';
		expect(linkify('https://www.youtube.com', {}, ['youtube.com'])).toBe(
			expectedLink
		);
	});
	it('should render a "nofollow ugc" rel attribute', () => {
		const expectedLink =
			'<a class="link" href="https://www.non-existing-webstie-12345.com" title="https://www.non-existing-webstie-12345.com" target="" rel="nofollow ugc">https://www.non-existing-webstie-12345.com</a>';
		expect(
			linkify('https://www.non-existing-webstie-12345.com', {}, ['youtube.com'])
		).toBe(expectedLink);
	});
});
