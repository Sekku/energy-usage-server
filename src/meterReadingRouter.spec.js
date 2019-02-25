/* eslint-disable no-new */
const KoaRouter = require('koa-router');
const { MeterReadingRouter } = require('./meterReadingRouter');
const { MeterReadingService } = require('./services/meterReadingService');

jest.mock('koa-router');
jest.mock('./services/meterReadingService');

describe('meterReadingRouter', () => {
  let koaRouter;
  let service;
  let mockCtx;
  let spyError;
  let spyWarn;
  let originalError;
  let originalWarn;

  beforeEach(() => {
    koaRouter = new KoaRouter();
    service = new MeterReadingService();
    originalError = console.error;
    originalWarn = console.warn;

    spyError = jest.spyOn(global.console, 'error').mockImplementation(() => {});
    spyWarn = jest.spyOn(global.console, 'warn').mockImplementation(() => {});

    mockCtx = {
      query: {
        start: '',
        end: ''
      },
      body: null,
      status: 0,
      request: {
        body: {
          newReading: 0,
          date: ''
        }
      }
    };
  });

  afterEach(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });

  describe('constructor', () => {
    it('should throw if parameters are not correct', () => {
      expect(() => {
        new MeterReadingRouter();
      }).toThrow();

      expect(() => {
        new MeterReadingRouter(koaRouter);
      }).toThrow();
    });

    it('should return a instance of MeterReadingRouter', () => {
      expect(new MeterReadingRouter(koaRouter, service)).toBeInstanceOf(MeterReadingRouter);
    });
  });

  describe('routeGetReadings', () => {
    it('should call next and assign a result to body if everything goes alright', async () => {
      expect.assertions(3);

      service.getReadings.mockImplementation(() => Promise.resolve([1, 2, 3]));
      koaRouter.get.mockImplementation(async (path, callback) => {
        callback(mockCtx, () => {
          expect(mockCtx.body).toEqual([1, 2, 3]);
          expect(service.getReadings).toHaveBeenCalled();
        });
      });

      const router = new MeterReadingRouter(koaRouter, service);
      router.routeGetReadings();
      expect(koaRouter.get).toHaveBeenCalled();
    });

    it('should not assign a result to body if it fails', async () => {
      expect.assertions(4);

      service.getReadings.mockImplementation(() => Promise.reject(new Error('Fail')));
      koaRouter.get.mockImplementation(async (path, callback) => {
        callback(mockCtx, async () => {
          expect(mockCtx.body).toBeNull();
          expect(service.getReadings).toHaveBeenCalled();
          expect(spyError).toHaveBeenCalled();
        });
      });

      const router = new MeterReadingRouter(koaRouter, service);
      router.routeGetReadings();
      expect(koaRouter.get).toHaveBeenCalled();
    });
  });

  describe('routeCreateReading', () => {
    it('should set a status of 400 if the body is incorrect', async () => {
      expect.assertions(1 + 3 * 5);

      koaRouter.post.mockImplementation(async (path, callback) => {
        callback(mockCtx, () => {
          expect(mockCtx.status).toBe(400);
          expect(service.insertReading).not.toHaveBeenCalled();
          expect(spyWarn).toHaveBeenCalled();
        });
      });

      const router = new MeterReadingRouter(koaRouter, service);
      router.routeCreateReading();
      expect(koaRouter.post).toHaveBeenCalled();

      mockCtx.request.body.newReading = null;
      router.routeCreateReading();

      mockCtx.request.body.newReading = '30000';
      router.routeCreateReading();

      mockCtx.request.body.newReading = 30000;
      mockCtx.request.body.date = 'Some date';
      router.routeCreateReading();

      mockCtx.request.body = null;
      router.routeCreateReading();
    });

    it('should not set a status of 200 if it fails', async () => {
      expect.assertions(4);

      mockCtx.request.body.newReading = 30000;
      mockCtx.request.body.date = new Date().toISOString();

      service.insertReading.mockImplementation(() => Promise.reject(new Error('Fail')));
      koaRouter.post.mockImplementation(async (path, callback) => {
        callback(mockCtx, async () => {
          expect(mockCtx.status).not.toBe(200);
          expect(service.insertReading).toHaveBeenCalled();
          expect(spyError).toHaveBeenCalled();
        });
      });

      const router = new MeterReadingRouter(koaRouter, service);
      router.routeCreateReading();
      expect(koaRouter.post).toHaveBeenCalled();
    });

    it('should set a status of 200 if everything is correct', async () => {
      expect.assertions(3);

      mockCtx.request.body.newReading = 30000;
      mockCtx.request.body.date = new Date().toISOString();

      service.insertReading.mockImplementation(() => Promise.resolve());
      koaRouter.post.mockImplementation(async (path, callback) => {
        callback(mockCtx, async () => {
          expect(mockCtx.status).toBe(200);
          expect(service.insertReading).toHaveBeenCalled();
        });
      });

      const router = new MeterReadingRouter(koaRouter, service);
      router.routeCreateReading();
      expect(koaRouter.post).toHaveBeenCalled();
    });
  });
});
