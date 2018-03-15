// @flow

/**
 * Pads numbers less than two digits with an additional
 * leading zero. Used for date and time formatting.
 */
export const padNumber = (num: number): string => (num < 10 ? `0${num}` : `${num}`);

/**
 * Returns a formatted time string from the local value of the datetime
 * object passed in for usage with the `find/upcoming_events` endpoint.
 * The formatted date must follow the format: `HH:MM:SS`. Javascript's
 * `.toISOString` method returns the iso value while we need the local value.
 */
export const getFormattedTime = (date: Date): string =>
	date.toLocaleTimeString('UTC', { hour12: false });

/**
 * Shifts a supplied time to match timezone indicated by offset
 *
 * @example
 * // time & offset usually provided by API for event objects
 * time = (new Date('2018-01-01T12:00:00-10:00')).getTime() // timestamp for 12 noon in -10hr timezone
 * offset = -10 * 60 * 60 * 1000 // ms offset for -10hr timezone
 * converted = convertToLocalTime(time, offset)
 * converted.toString(); // == '... Jan 01 2018 12:00:00 ...'
 */
export const convertToLocalTime = (time: number, offset: number = 0): Date => {
        // Takes in desired date to convert and applies offset
        const date = new Date(time + offset);
        // generates new date object taking the time in milliseconds and
        // adds the runtime environment's timezone offset
        const localDate = new Date(
                date.getTime() + date.getTimezoneOffset() * 60000
        );

        return localDate;
};
