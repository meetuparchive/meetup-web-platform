// @flow

/**
 * Pads numbers less than two digits with an additional
 * leading zero. Used for date and time formatting.
 * @param {Number} num  Number to be padded
 * @returns {String} Returns a padded string
 */
export const padNumber = (num: number) => (num < 10 ? `0${num}` : `${num}`);

/**
 * Returns a formatted time string from the local value of the datetime
 * object passed in for usage with the `find/upcoming_events` endpoint.
 * The formatted date must follow the format: `HH:MM:SS`. Javascript's
 * `.toISOString` method returns the iso value while we need the local value.
 * @param {Date} date date object
 * @returns {String} Formatted local date string in format `HH:MM:SS`
 */
export const getFormattedTime = (date: Date) =>
        date.toLocaleTimeString('UTC', { hour12: false });

/**
 * Returns a Date object that offsets the supplied UTC time, correcting for the runtime environment's current UTC offset.
 * @param  {Number} time millisecond value of event time stored relative to the servers time (which is nyc)
 * @param  {Number} offset millisecond value of offset of chapters location also provided in milliseconds
 * @return {Date} date object which has applied utc offset to generate "local" time
 */
export const convertToLocalTime = (time: number, offset: number = 0) => {
        // Takes in desired date to convert and applies offset
        const eventTime = new Date(time + offset);
        // generates new date object taking the time in milliseconds and
        // adds the runtime environment's timezone offset
        const localDate = new Date(
                eventTime.getTime() + eventTime.getTimezoneOffset() * 60000
        );

        return localDate;
};
