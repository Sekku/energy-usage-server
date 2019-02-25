const Koa = require('koa');

const server = require('./index');

describe('index', () => {
  it('should create an instance of a Koa server', () => {
    const instance = server();
    expect(instance).toBeInstanceOf(Koa);
  });
});
