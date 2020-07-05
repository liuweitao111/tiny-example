const http = require('http');
const Stream = require('stream');
const EventEmitter = require('events');
const context = require('./context');
const request = require('./request');
const response = require('./response');

class Koa extends EventEmitter {
  constructor() {
    super();
    this.middleware = [];
    this.context = context;
    this.request = request;
    this.response = response;
  }

  // 创建ctx
  createContext(req, res) {
    const ctx = Object.create(this.context);
    const request = ctx.request = Object.create(this.request);
    const response = ctx.response = Object.create(this.response);
    ctx.req = request.req = response.req = req;
    ctx.res = request.res = response.res = res;
    request.ctx = response.ctx = ctx;
    request.response = response;
    response.request = request;
    return ctx;
  }

  // 注册middleware
  use(fn) {
    this.middleware.push(fn);
  }

  // 通过递归调用middleware实现koa中的洋葱模型
  compose(middleware, ctx) {
    const dispatch = (index) => {
      if(index === middleware.length) {
        return Promise.resolve();
      }
      return Promise.resolve(middleware[index](ctx, () => dispatch(index + 1)));
    }
    return dispatch(0);
  }

  // 处理请求
  handleRequest(req, res){
    res.statusCode = 404;
    const ctx = this.createContext(req, res);
    const fn = this.compose(this.middleware, ctx);
    fn.then(() => {
      if(typeof ctx.body === 'object') {
        res.setHeader('Content-Type', 'application/json;charset=utf8')
        res.end(JSON.stringify(ctx.body));
      } 
      else if(ctx instanceof Stream) {
        ctx.body.pipe(res);
      }
      else if(typeof ctx.body === 'string' || Buffer.isBuffer(ctx.body)) {
        res.setHeader('Content-Type', 'text/htmlcharset=utf8')
        res.end(ctx.body)
      }
      else {
        res.end('Not found');
      }
    }).catch(err => {
      this.emit('error', err);
      res.statusCode = 500;
      res.end('Service Error');
    });
  }

  listen(...args) {
    const service = http.createServer(this.handleRequest.bind(this));
    service.listen(...args);
  }
}

module.exports = Koa;
