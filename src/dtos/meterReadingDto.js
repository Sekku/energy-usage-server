const moment = require('moment');
const { isEndOfMonth, getDaysUntilMonthEnd } = require('../utils');

/**
 * Linear interpolation
 * https://en.wikipedia.org/wiki/Linear_interpolation
 */
const lerp = (x0, x1, y0, y1, x) => {
  return y0 + (x - x0) * ((y1 - y0) / (x1 - x0));
};

/**
 * Interpolates an estimate reading for the current month, if the date is not the end of the month
 */
const interpolateLastDayMonth = (prev, current, post) => {
  const currentMoment = moment(current.reading_date);
  // We don't need to interpolate if the reading is on the last day of the month
  if (isEndOfMonth(currentMoment)) {
    return null;
  }

  const prevMoment = moment(prev.reading_date);
  const postMoment = moment(post.reading_date);
  const daysUntilMonthEnd = getDaysUntilMonthEnd(currentMoment);

  // Around the end of the year, to maintain the interpolation correct, we add 365
  // to the dayOfYear of the next year, so the calculations are correct
  const prevDayOfYear = prevMoment.dayOfYear();
  const currentDayOfYear =
    prevMoment.year() === currentMoment.year()
      ? currentMoment.dayOfYear() + daysUntilMonthEnd
      : currentMoment.dayOfYear() + daysUntilMonthEnd + 365;
  const postDayOfYear =
    postMoment.year() === prevMoment.year() ? postMoment.dayOfYear() : postMoment.dayOfYear() + 365;

  return lerp(prevDayOfYear, postDayOfYear, prev.cumulative, post.cumulative, currentDayOfYear);
};

class MeterReadingDto {
  static interpolateValues(meterReadings) {
    if (!Array.isArray(meterReadings)) {
      return null;
    }

    const results = [];
    if (meterReadings.length > 0) {
      results.push(
        new MeterReadingDto(
          meterReadings[0].reading_date,
          meterReadings[0].cumulative,
          meterReadings[0].unit,
          null
        )
      );
    }

    for (let i = 1; i < meterReadings.length - 1; i += 1) {
      results.push(
        new MeterReadingDto(
          meterReadings[i].reading_date,
          meterReadings[i].cumulative,
          meterReadings[i].unit,
          Math.round(
            interpolateLastDayMonth(meterReadings[i - 1], meterReadings[i], meterReadings[i + 1])
          )
        )
      );
    }

    if (meterReadings.length > 1) {
      results.push(
        new MeterReadingDto(
          meterReadings[meterReadings.length - 1].reading_date,
          meterReadings[meterReadings.length - 1].cumulative,
          meterReadings[meterReadings.length - 1].unit,
          null
        )
      );
    }

    return results;
  }

  constructor(readingDate, cumulative, unit, interpolation) {
    this.readingDate = readingDate;
    this.cumulative = cumulative;
    this.unit = unit;
    this.estimation = interpolation;
  }
}

module.exports = {
  MeterReadingDto
};
