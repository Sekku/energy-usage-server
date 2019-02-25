const KoaRouter = require('koa-router');
const { to, objectIsEmpty, isValidDate, isNumeric } = require('./utils');
const { MeterReadingService } = require('./services/meterReadingService');

class MeterReadingRouter {
  constructor(router, meterReadingService, basePath) {
    if (!(router instanceof KoaRouter)) {
      throw new Error('router is not an instance of koa-router');
    }

    if (!(meterReadingService instanceof MeterReadingService)) {
      throw new Error('meterReadingService is not an instance of meterReading');
    }
    this.router = router;
    this.meterReadingService = meterReadingService;
    this.basePath = typeof basePath === 'string' ? basePath : '';
  }

  routeGetReadings() {
    this.router.get(`${this.basePath}/`, async (ctx, next) => {
      const [rows, err] = await to(
        this.meterReadingService.getReadings(ctx.query.start, ctx.query.end)
      );
      if (err) {
        console.error(err);
      } else {
        ctx.body = rows;
      }
      next();
    });
  }

  routeCreateReading() {
    const validateBody = body => {
      if ((body || null) === null || objectIsEmpty(body)) {
        console.warn('Create reading: body is null');
        return false;
      }
      if (!isNumeric(body.newReading) || Number(body.newReading) < 0) {
        console.warn('Create reading: no reading provided');
        return false;
      }

      if (!isValidDate(body.date)) {
        console.warn(`Create reading: wrong date format: ${body.date}`);
        return false;
      }

      return true;
    };
    this.router.post(`${this.basePath}/`, async (ctx, next) => {
      const { body } = ctx.request;
      if (!validateBody(body)) {
        ctx.status = 400;
      } else {
        const [, err] = await to(
          this.meterReadingService.insertReading(Number(body.newReading), new Date(body.date))
        );
        if (err) {
          console.error(err);
          ctx.body = {
            err: err.message
          };
        } else {
          ctx.status = 200;
          ctx.body = {};
        }
      }
      next();
    });
  }
}

module.exports = {
  MeterReadingRouter
};
