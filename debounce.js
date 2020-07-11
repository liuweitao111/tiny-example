/**
 * 触发高频事件后wait秒内函数只会执行一次，如果wait秒内高频事件再次被触发，则重新计算时间
 * @param {function} func 
 * @param {number} wait 
 * @param {boolean} immediate 是否立即执行
 */
function debounce(func, wait, immediate) {
  var timeout = null;
  var debounced = function(...args) {
    if(timeout) {
      clearTimeout(timeout);
    }
    if(immediate) {
      var nowCall = !timeout;
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
      if(nowCall) {
        func.apply(this, args);
      }
    } else {
      timeout = setTimeout(() => {
        func.apply(this, args);
      }, wait);
    }
  }
  debounced.cancel = function() {
    clearTimeout(timeout);
    timeout = null;
  }
  return debounced;
}