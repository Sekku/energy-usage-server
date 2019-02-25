const data = require('./data');
const sampleData = require('../../sampleData.json');

describe('data', () => {
  it('initialize should import the data from the sampleData file', async () => {
    data.initialize();

    await data.connection.serialize(() => {
      data.connection.all(
        'SELECT * FROM meter_reads ORDER BY cumulative',
        (error, selectResult) => {
          expect(error).toBeNull();
          expect(selectResult.length).toBe(sampleData.electricity.length);
          selectResult.forEach((row, index) => {
            expect(row.cumulative).toEqual(sampleData.electricity[index].cumulative);
          });
        }
      );
    });
  });
});
