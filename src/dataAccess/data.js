const sqlite3 = require('sqlite3').verbose();
const sampleData = require('../../sampleData.json');

const connection = new sqlite3.Database(':memory:');

/**
 * Imports the data from the sampleData.json file into a `meter_reads` table.
 * The table contains three columns - cumulative, reading_date and unit.
 *
 * An example query to get all meter reads,
 *   connection.all('SELECT * FROM meter_reads', (error, data) => console.log(data));
 *
 * Note, it is an in-memory database, so the data will be reset when the
 * server restarts.
 */
function initialize() {
  connection.serialize(() => {
    connection.run('CREATE TABLE meter_reads (cumulative INTEGER, reading_date TEXT, unit TEXT)');

    const { electricity } = sampleData;
    electricity.forEach(data => {
      connection.run('INSERT INTO meter_reads (cumulative, reading_date, unit) VALUES (?, ?, ?)', [
        data.cumulative,
        data.readingDate,
        data.unit
      ]);
    });
  });
}

module.exports = {
  initialize,
  connection
};
