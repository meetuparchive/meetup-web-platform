import { generateCanonicalUrl } from './links';
import { getSocialLinks } from 'mwp-app-render/src/util/socialHelper';

export const DEFAULT_TITLE = 'Meetup';
export const SCHEMA_ORG = 'http://schema.org';
export const MEETUP_SWARM_LOGO_URL = 'https://secure.meetupstatic.com/s/img/786824251364989575000/logo/swarm/m_swarm_630x630.png';

/**
 * Generated Object of LD-JSON of organization info
 * @see https://json-ld.org/ - to learn more about ld-json
 * @param {String} baseUrl base url of the page (protocol + hostname)
 * @param {String} localeCode locale of user
 * @param {String} route redux'd route to the current page
 * @return {Object} accumulated json object
 */
export const generateOrganizationLdJson = (baseUrl, localeCode, route) => {
	const socialLinks = getSocialLinks(localeCode);
	const url = generateCanonicalUrl(baseUrl, localeCode, route);
	return {
		'@type': 'Organization',
		'@context': SCHEMA_ORG,
		url,
		name: DEFAULT_TITLE,
		logo: MEETUP_SWARM_LOGO_URL,
		sameAs: [
			socialLinks.facebook,
			socialLinks.twitter,
			socialLinks.youtube,
			socialLinks.googlePlus,
			socialLinks.instagram,
		],
	};
};

/**
 * Generated Object of LD-JSON used if event has a venue
 * @see https://json-ld.org/ - to learn more about ld-json
 * @param {Object} venue venue object associated with the event
 * @return {Object} accumulated json object
 */
export const generateLocationLdJson = venue => {
	const address = {
		'@type': 'PostalAddress',
		streetAddress: [venue.address_1, venue.address_2, venue.address_3]
			.filter(k => k !== undefined && k !== '')
			.join(' '),
		addressLocality: venue.city,
		postalCode: venue.zip,
		addressRegion: venue.state,
		addressCountry: venue.localized_country_name,
	};

	const geo = {
		'@type': 'GeoCoordinates',
		latitude: venue.lat,
		longitude: venue.lon,
	};

	return {
		location: {
			'@type': 'Place',
			name: venue.name,
			address,
			geo,
		},
	};
};

/**
 * Generated Object of LD-JSON if event has a fee associated
 * @see https://json-ld.org/ - to learn more about ld-json
 * @param {Object} fee Fee data associated with event
 * @return {Object} accumulated json object
 */
export const generateFeeLdJson = fee =>
	({
		offers: {
			'@type': 'Offer',
			price: fee.amount,
			priceCurrency: fee.currency,
		},
	});

/**
 * Generated Object of LD-JSON used for search engines to read data on page
 * @see https://json-ld.org/ - to learn more about ld-json
 * @param {Object} eventInfo event object for the page
 * @return {Object} accumulated json object
 */
export const generateEventLdJson = eventInfo => {
	const startDate =
		eventInfo.time &&
		convertToLocalTime(eventInfo.time, eventInfo.utc_offset).toISOString();
	const offers = eventInfo.fee ? generateFeeLdJson(eventInfo.fee) : {};
	const location = eventInfo.venue ? generateLocationLdJson(eventInfo.venue) : {};

	// trim description to 500 characters
	const description = (
		eventInfo.plain_text_no_images_description ||
		eventInfo.description ||
		''
	).substring(0, 500);

	return {
		'@context': SCHEMA_ORG,
		'@type': 'Event',
		name: eventInfo.name,
		url: eventInfo.link,
		description,
		startDate,
		...location,
		...offers,
	};
};

/**
 * NOTE: This was lifted from mup-web's src/app/group/groupDateConversionUtils.js and should probably not reside in both repos for long
 * Returns a Date object that offsets the supplied UTC time, correcting for the runtime environment's current UTC offset.
 * @param {Number} time millisecond value of event time stored relative to the servers time (which is nyc)
 * @param {Number} offset millisecond value of offset of chapters location also provided in milliseconds
 * @return {Date} date object which has applied utc offset to generate "local" time
 */
export const convertToLocalTime = (time, offset = 0) => {
        // Takes in desired date to convert and applies offset
        const eventTime = new Date(time + offset);
        // generates new date object taking the time in milliseconds and
        // adds the runtime environment's timezone offset
        const localDate = new Date(
                eventTime.getTime() + eventTime.getTimezoneOffset() * 60000
        );

        return localDate;
};
