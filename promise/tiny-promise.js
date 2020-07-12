/**
 * 实现Promise中的链式调用
 * 其核心思想为then方法会向cbs数组中添加onResolved
 * resolve被调用时，依次执行cbs数组中的函数
 */
function Promise(fn) {
  this.cbs = [];
  const resolve = (value) => {
    setTimeout(() => {
      this.data = value;
      this.cbs.forEach(cb => {cb(value)})
    });
  }
  fn(resolve.bind(this));
}
Promise.prototype.then = function(onResolved) {
  return new Promise(resolve => {
    this.cbs.push(() => {
      const res = onResolved(this.data);
      if(res instanceof Promise) {
        res.then(resolve);
      }else {
        resolve(res);
      }
    })
  })
}

new Promise(resolve => {
  setTimeout(() => {
    resolve(1);
  }, 500)
}).then(res => {
  console.log(res);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(2);
    }, 500)
  })
}).then(res => {
  console.log(res);
});