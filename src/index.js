const Koa = require('koa');
const KoaRouter = require('koa-router');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const data = require('./dataAccess/data');
const { MeterReadingRouter } = require('./meterReadingRouter');
const { MeterReadingService } = require('./services/meterReadingService');

const PORT = process.env.PORT || 3000;

function createServer() {
  const server = new Koa();

  const router = new KoaRouter();

  const service = new MeterReadingService(data.connection);
  const meterRt = new MeterReadingRouter(router, service, '/readings');
  meterRt.routeGetReadings();
  meterRt.routeCreateReading();

  server.use(cors());
  server.use(bodyParser());
  server.use(router.allowedMethods());
  server.use(router.routes());

  server.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      ctx.status = err.status || 500;
      ctx.body = err.message;
      ctx.app.emit('error', err, ctx);
    }
  });

  return server;
}

module.exports = createServer;

if (!module.parent) {
  data.initialize();
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
  });

  server.on('error', (err, ctx) => {
    console.error('An unhandled error occurred', err, ctx);
  });
}
