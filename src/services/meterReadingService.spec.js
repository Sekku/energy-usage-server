const { MeterReadingService } = require('./meterReadingService');
const { to } = require('../utils');

describe('meterReadingRouter', () => {
  const allMock = jest.fn().mockName('connection.all');
  const getMock = jest.fn().mockName('connection.get');
  const runMock = jest.fn().mockName('connection.run');
  const mockConnection = {
    all: allMock,
    run: runMock,
    get: getMock
  };

  beforeEach(() => {
    allMock.mockReset().mockName('connection.all');
    runMock.mockReset().mockName('connection.run');
    getMock.mockReset().mockName('connection.get');
  });

  describe('constructor', () => {
    it('should return a instance of MeterReadingRouter', () => {
      expect(new MeterReadingService(mockConnection)).toBeInstanceOf(MeterReadingService);
    });
  });

  describe('getReadings', () => {
    it('should call connection.all with the correct query and return a value', async () => {
      expect.assertions(8);

      const service = new MeterReadingService(mockConnection);
      const startDate = new Date(2017, 1, 1).toISOString();
      const endDate = new Date(2019, 1, 1).toISOString();
      let expectedQuery = `SELECT cumulative, reading_date, unit FROM meter_reads  ORDER BY reading_date DESC`;
      allMock.mockImplementationOnce((query, callback) => {
        expect(query).toBe(expectedQuery);
        callback(undefined, [1, 2, 3]);
      });
      let results = await service.getReadings();
      expect(results).toEqual([1, 2, 3]);

      expectedQuery = `SELECT cumulative, reading_date, unit FROM meter_reads WHERE reading_date >= '${startDate}' ORDER BY reading_date DESC`;
      allMock.mockImplementationOnce((query, callback) => {
        expect(query).toBe(expectedQuery);
        callback(undefined, []);
      });
      results = await service.getReadings(startDate);
      expect(results).toEqual([]);

      expectedQuery = `SELECT cumulative, reading_date, unit FROM meter_reads WHERE reading_date <= '${endDate}' ORDER BY reading_date DESC`;
      allMock.mockImplementationOnce((query, callback) => {
        expect(query).toBe(expectedQuery);
        callback(undefined, [4, 5, 6]);
      });
      results = await service.getReadings(null, endDate);
      expect(results).toEqual([4, 5, 6]);

      expectedQuery = `SELECT cumulative, reading_date, unit FROM meter_reads WHERE reading_date >= '${startDate}' AND reading_date <= '${endDate}' ORDER BY reading_date DESC`;
      allMock.mockImplementationOnce((query, callback) => {
        expect(query).toBe(expectedQuery);
        callback(undefined, [4, 5, 6]);
      });
      results = await service.getReadings(startDate, endDate);
      expect(results).toEqual([4, 5, 6]);
    });

    it('should reject if something is wrong', async () => {
      expect.assertions(3);

      const service = new MeterReadingService(mockConnection);
      const expectedQuery = `SELECT cumulative, reading_date, unit FROM meter_reads  ORDER BY reading_date DESC`;
      allMock.mockImplementation((query, callback) => {
        expect(query).toBe(expectedQuery);
        callback(new Error('Fail'), [1, 2, 3]);
      });

      const [results, err] = await to(service.getReadings());
      expect(err).toBeInstanceOf(Error);
      expect(results).not.toEqual([1, 2, 3]);
    });
  });

  describe('insertReadings', () => {
    it('should call connection.get and connection.run, and resolve', async () => {
      expect.assertions(4);

      const service = new MeterReadingService(mockConnection);
      const dbRow = {
        reading_date: new Date(2017, 1, 1).toISOString(),
        cumulative: 1
      };
      const newRow = {
        newReading: 1000,
        newDate: new Date(2019, 1, 1)
      };
      getMock.mockImplementation((query, callback) => {
        expect(query).toBe(`SELECT * FROM meter_reads ORDER BY reading_date DESC`);
        callback(undefined, dbRow);
      });

      runMock.mockImplementation((query, params, callback) => {
        expect(query).toBe(
          'INSERT INTO meter_reads (cumulative, reading_date, unit) VALUES (?, ?, ?)'
        );
        expect(params).toEqual([newRow.newReading, newRow.newDate.toISOString(), 'kWh']);
        callback();
      });
      const [, err] = await to(service.insertReading(newRow.newReading, newRow.newDate));
      expect(err).toBeNull();
    });

    it('should reject if parameters are wrong', async () => {
      const service = new MeterReadingService(mockConnection);

      let newRow = {
        newReading: null,
        newDate: new Date(2017, 1, 1)
      };

      let [, err] = await to(service.insertReading(newRow.newReading, newRow.newDate));
      expect(err).toBeInstanceOf(Error);
      expect(getMock).not.toHaveBeenCalled();
      expect(runMock).not.toHaveBeenCalled();

      newRow = {
        newReading: 3000,
        newDate: 'Some date'
      };

      [, err] = await to(service.insertReading(newRow.newReading, newRow.newDate));
      expect(err).toBeInstanceOf(Error);
      expect(getMock).not.toHaveBeenCalled();
      expect(runMock).not.toHaveBeenCalled();
    });

    it('should reject if get fails', async () => {
      expect.assertions(3);

      const service = new MeterReadingService(mockConnection);

      const newRow = {
        newReading: 30000,
        newDate: new Date(2017, 1, 1)
      };

      getMock.mockImplementation((query, callback) => {
        expect(query).toBe(`SELECT * FROM meter_reads ORDER BY reading_date DESC`);
        callback(new Error(`Fail`), {});
      });

      const [, err] = await to(service.insertReading(newRow.newReading, newRow.newDate));
      expect(err).toBeInstanceOf(Error);
      expect(runMock).not.toHaveBeenCalled();
    });

    it('should reject if the new reading conflicts with the previous one', async () => {
      expect.assertions(6);

      const service = new MeterReadingService(mockConnection);

      const dbRow = {
        reading_date: new Date(2017, 1, 1).toISOString(),
        cumulative: 1000
      };

      let newRow = {
        newReading: 30000,
        newDate: new Date(2016, 1, 1)
      };

      getMock.mockImplementation((query, callback) => {
        expect(query).toBe(`SELECT * FROM meter_reads ORDER BY reading_date DESC`);
        callback(undefined, dbRow);
      });

      let [, err] = await to(service.insertReading(newRow.newReading, newRow.newDate));
      expect(err).toBeInstanceOf(Error);
      expect(runMock).not.toHaveBeenCalled();

      newRow = {
        newReading: 500,
        newDate: new Date(2019, 1, 1)
      };

      [, err] = await to(service.insertReading(newRow.newReading, newRow.newDate));
      expect(err).toBeInstanceOf(Error);
      expect(runMock).not.toHaveBeenCalled();
    });
  });
});
