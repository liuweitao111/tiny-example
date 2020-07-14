function Promise(executor) {
  const self = this;
  // Promise当前的状态
  self.status = 'padding';
  // 如果promise在fulfilled状态, 必须有一个value值
  self.value;
  // 如果promise在rejected状态, 必须有一个promise被reject的reason
  self.reason;
  // Promise resolve时的回调函数集，因为在Promise结束之前有可能有多个回调添加到它上面
  self.onResolvedCallback = [];
  // Promise reject时的回调函数集，因为在Promise结束之前有可能有多个回调添加到它上面
  self.onRejectedCallback = [];

  function resolve(value) {
    setTimeout(function() {
      if(self.status === 'padding') {
        self.status = 'resolved';
        self.value = value;
        self.onResolvedCallback.forEach(cb => { cb(value) });
      }
    });
  }

  function reject(reason) {
    setTimeout(function() {
      if(self.status === 'padding') {
        self.status = 'rejected';
        self.reason = reason;
        self.onRejectedCallback.forEach(cb => { cb(reason) });
      }
    });
  }

  try {
    executor(resolve, reject);
  } catch(e) {
    reject(e);
  }
}

function resolvePromise(promise2, x, resolve, reject) {
  let called = false;

  if(promise2 === x) {
    return reject(new TypeError('A promise cannot be resolved with itself.'));
  }

  if(x instanceof Promise) {
    if(x.status === 'padding') {
      x.then(function(value) {
        resolvePromise(promise2, value, resolve, reject);
      }, reject);
    } else {
      x.then(resolve, reject);
    }
    return;
  }

  if((x !== null) && ((typeof x === 'object') || (typeof x === 'function'))) {
    try {
      const then = x.then;
      if(typeof then === 'function') {
        then.call(x, function rs(value) {
          if(called) {
            return;
          }
          called = true;
          return resolvePromise(promise2, value, resolve, reject);
        }, function rj(reason) {
          if(called) {
            return;
          }
          called = true;
          return reject(reason);
        });
      } else {
        resolve(x);
      }
    } catch(e) {
      if(called) {
        return;
      }
      called = true;
      return reject(e);
    }
  } else {
    resolve(x);
  }
}

Promise.prototype.then = function(onResolved, onRejected) {
  const self = this;
  let promise2;

  // 如果then的参数不是function，则我们需要忽略它，此处以如下方式处理
  onResolved = typeof onResolved === 'function' ? onResolved : function(value) { return value; };
  onRejected = typeof onRejected === 'function' ? onRejected : function(reason) { throw reason; };

  if(self.status === 'resolved') {
    return promise2 = new Promise(function(resolve, reject) {
      setTimeout(function() {
        try {
          var x = onResolved(self.value);
          resolvePromise(promise2, x, resolve, reject);
        } catch(e) {
          reject(e);
        }
      })
    });
  }

  if(self.status === 'rejected') {
    return promise2 = new Promise(function(resolve, reject) {
      setTimeout(function(){
        try {
          var x = onRejected(self.reason);
          resolvePromise(promise2, x, resolve, reject);
        } catch(e) {
          reject(e);
        }
      })
    })
  }

  if(self.status === 'padding') {
    return promise2 = new Promise(function(resolve, reject) {
      self.onResolvedCallback.push(function(value) {
        try {
          var x= onResolved(value);
          resolvePromise(promise2, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });

      self.onRejectedCallback.push(function(reason) {
        try {
          var x= onRejected(reason);
          resolvePromise(promise2, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      })
    })
  }
}

Promise.prototype.catch = function(onRejected) {
  return this.then(null, onRejected)
}

Promise.resolve = function(value) {
  // 参数是一个 Promise 实例
  if(value && value instanceof Promise) {
    return value;
  }
  // 参数是一个thenable对象
  if(value && typeof value === 'object') {
    const then = value.then;
    if(typeof then === 'function') {
      return new Promise(resolve => then(resolve));
    }
  }
  // 参数不是具有then方法的对象，或根本就不是对象
  return new Promise(resolve => resolve(value));
}

// Promise.reject()方法的参数，会原封不动地作为reject的理由，变成后续方法的参数
Promise.reject = function(reason) {
  return new Promise((_, reject) => reject(reason));
}

Promise.prototype.finally = function(callback) {
  return this.then(
    value => Promise.resolve(callback()).then(() => value),
    reason => Promise.resolve(callback()).then(() => {throw reason})
  );
}

// 使用promises-aplus-tests时打开注释
// Promise.deferred = Promise.defer = function() {
//   var dfd = {}
//   dfd.promise = new Promise(function(resolve, reject) {
//     dfd.resolve = resolve
//     dfd.reject = reject
//   })
//   return dfd
// }

module.exports = Promise;