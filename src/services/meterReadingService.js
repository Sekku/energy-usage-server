const { isValidDate } = require('../utils');
const { MeterReadingDto } = require('../dtos/meterReadingDto');

class MeterReadingService {
  constructor(dbConnection) {
    this.connection = dbConnection;
    this.unit = 'kWh';
  }

  getReadings(start, end) {
    return new Promise((resolve, reject) => {
      let whereClause = '';
      if (isValidDate(start)) {
        whereClause = `WHERE reading_date >= '${start}'`;
      }
      if (isValidDate(end)) {
        whereClause = whereClause
          ? `${whereClause} AND reading_date <= '${end}'`
          : `WHERE reading_date <= '${end}'`;
      }
      this.connection.all(
        // prettier-ignore
        `SELECT cumulative, reading_date, unit FROM meter_reads ${whereClause} ORDER BY reading_date ASC`,
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(MeterReadingDto.interpolateValues(rows));
          }
        }
      );
    });
  }

  insertReading(newReading, newDate) {
    return new Promise((resolve, reject) => {
      if (typeof newReading !== 'number' || newReading < 0) {
        reject(new Error('The reading is not valid'));
        return;
      }

      if (!(newDate instanceof Date)) {
        reject(new Error('The date is not valid'));
        return;
      }

      this.connection.get('SELECT * FROM meter_reads ORDER BY reading_date DESC', (getErr, row) => {
        if (getErr) {
          reject(getErr);
          return;
        }
        if (row) {
          const format = date => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

          const lastDate = new Date(row.reading_date);
          lastDate.setHours(0, 0, 0, 0);
          newDate.setHours(0, 0, 0, 0);
          if (lastDate >= newDate) {
            reject(
              new Error(
                `The date ${format(
                  newDate
                )} of the reading is older or equal than the last one ${format(lastDate)}`
              )
            );
            return;
          }

          // Check also that the new date is not the same month and year than the last one
          if (
            lastDate.getFullYear() === newDate.getFullYear() &&
            lastDate.getMonth() === newDate.getMonth()
          ) {
            reject(
              new Error(`A reading for the month of ${format(newDate)} is already introduced`)
            );
            return;
          }
          const lastReading = row.cumulative;
          if (lastReading > newReading) {
            reject(
              new Error(
                `The last reading ${lastReading} is greater than the new reading ${newReading}`
              )
            );
            return;
          }
        }
        this.connection.run(
          'INSERT INTO meter_reads (cumulative, reading_date, unit) VALUES (?, ?, ?)',
          [newReading, newDate.toISOString(), this.unit],
          runErr => {
            if (runErr) {
              reject(runErr);
            } else {
              resolve();
            }
          }
        );
      });
    });
  }
}

module.exports = {
  MeterReadingService
};
