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
 * Returns a Date object that offsets the supplied UTC time, correcting for the runtime environment's current UTC offset.
 */
export const convertToLocalTime = (time: number, offset: number = 0): Date => {
        // Takes in desired date to convert and applies offset
        const eventTime = new Date(time + offset);
        // generates new date object taking the time in milliseconds and
        // adds the runtime environment's timezone offset
        const localDate = new Date(
                eventTime.getTime() + eventTime.getTimezoneOffset() * 60000
        );

        return localDate;
};
