const moment = require('moment');

/**
 * Determines if a value represents a number
 *
 * In a similar way to isFinite, it returns false for "special" numbers `NaN`, `+Infinity` and `-Infinity`.
 * On the contrary, where isFinite(null) === true, isNumeric(null) === false
 *
 * @param {*} value Value to check
 * @returns {boolean} True if `value` is a `Number` and is finite, i.e., not any of null, undefined, NaN or (+/-)Infinity
 */
const isNumeric = val =>
  /* Google's Angular implementation of isNumeric */
  !Number.isNaN(val - parseFloat(val));

/**
 * Tests if a string is valid date (But not numbers or numeric strings)
 * https://stackoverflow.com/questions/10589732/checking-if-a-date-is-valid-in-javascript
 *
 * @param {*} value Value to check.
 * @returns {boolean} True if `value` is a valid date.
 */
const isValidDate = val => {
  if (typeof val !== 'string') {
    return false;
  }
  if (isNumeric(val)) {
    return false;
  }

  const date = new Date(val);
  return date instanceof Date && !Number.isNaN(date.valueOf());
};

/**
 * Checks if an object is an empty object
 * @param {*} obj
 */
const objectIsEmpty = obj => {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // https://stackoverflow.com/a/32108184/317666
  if (Object.entries) {
    return Object.entries(obj).length === 0 && obj.constructor === Object;
  }
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

/**
 * Awaits for a promise and returns an array with 2 elements
 * The first one is the returned data from the promise. If the promise fails, then it'll be null
 * The second one is the error, if something happened
 * @param {Promise} promise Promise to be awaited
 */
const to = async promise => {
  try {
    const data = await promise;
    return [data, null];
  } catch (err) {
    return [null, err];
  }
};

/**
 * Check whether a moment object is the end of the month.
 * Ignore the time part.
 * @param {moment} mmt
 */
function isEndOfMonth(mmt) {
  // startOf allows to ignore the time component
  // we call moment(mmt) because startOf and endOf mutate the momentj object.
  return moment
    .utc(mmt)
    .startOf('day')
    .isSame(
      moment
        .utc(mmt)
        .endOf('month')
        .startOf('day')
    );
}

/**
 * Returns the difference between two moment objects in number of days.
 * @param {moment} mmt1
 * @param {moment} mm2
 */
function getDiffInDays(mmt1, mm2) {
  return mmt1.diff(mm2, 'days');
}

/**
 * Return the number of days between the given moment object
 * and the end of the month of this moment object.
 * @param {moment} mmt
 */
function getDaysUntilMonthEnd(mmt) {
  return getDiffInDays(moment.utc(mmt).endOf('month'), mmt);
}

module.exports = {
  isEndOfMonth,
  getDaysUntilMonthEnd,
  getDiffInDays,
  to,
  objectIsEmpty,
  isValidDate,
  isNumeric
};
