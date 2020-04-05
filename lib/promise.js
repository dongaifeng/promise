(function (window) {
  // excutor:执行器寒素 同步执行
  function Promise(excutor) {
    const PENDING = 'pending';
    const RESOLVED = 'resolved';
    const REJECTED = 'rejected';

    this.PENDING = PENDING;
    this.RESOLVED = RESOLVED;
    this.REJECTED = REJECTED;

    const self = this;
    self.status = PENDING;
    self.data = undefined;
    self.callbacks = []; //  {onResolved(){}, onRejected(){}}

    // 同步执行 执行器
    // 监测执行抛出错误 直接 reject
    try {
      excutor(resolve, reject);
    } catch (error) {
      reject(error);
    }

    function resolve(value) {
      if (self.status !== PENDING) return false;
      // 1 改变状态
      self.status = RESOLVED;
      //  2保存value
      self.data = value;
      //  3执行callback函数 异步执行
      if (self.callbacks.length > 0) {
        setTimeout(() => {
          self.callbacks.forEach((obj) => {
            obj.onResolved(value);
          });
        });
      }
    }

    function reject(reason) {
      if (self.status !== PENDING) return false;
      self.status = REJECTED;
      self.data = reason;
      if (self.callbacks.length > 0) {
        setTimeout(() => {
          self.callbacks.forEach((obj) => {
            obj.onRejected(reason);
          });
        });
      }
    }
  }

  Promise.prototype.then = function (onResolved, onRejected) {
    const self = this;

    // 指定默认的onRejected
    onRejected =
      typeof onRejected === 'function' ? onRejected : (reason) => { throw reason; };
    // 指定默认 onResolved  向后传递value
    onResolved = typeof onResolved === 'function' ? onResolved : (value) => value;
    // 用户调用then方法时，返回一个新的promise对象
    return new Promise((resolve, reject) => {
      if (self.status === this.REJECTED) {
        setTimeout(() => {
          handle(onRejected);
        });
      } else if (self.status === this.RESOLVED) {
        setTimeout(() => {
          handle(onResolved);
        });
      } else {
        self.callbacks.push({
          onResolved() {
            handle(onResolved);
          },

          onRejected() {
            handle(onRejected);
          },
        });
      }

      // 提取函数 根据 用户调用then方法时 执行的参数函数，来判断返回新的promise对象的状态
      function handle(callback) {
        try {
          const result = callback(self.data);
          // 这里要分析 onResolved 的返回值，有几种情况
          // 1 抛出异常 返回的新的promise对象 状态应该是reject
          // 2 如果返回的promise，要根据promise的状态，来确定返回新的promise状态
          // 3 不是promise对象 就是resolve
          if (result instanceof Promise) {
            // result.then(value => { resolve(value) }, reason => { reject(reason) }) // 2
            result.then(resolve, reject);
          } else {
            resolve(result); // 3
          }
        } catch (error) {
          // 1 的情况
          reject(error);
        }
      }
    });
  };
  Promise.prototype.catch = function (onRejected) {
    return this.then(undefined, onRejected);
  };

  Promise.resolve = function (value) {
    // 这里要判断用户调用Promis.resolve传 的参数
    // 1 不是promise 就直接resolve返回
    // 2 是promise 根据promise判断
    return new Promise((resolve, reject) => {
      if (value instanceof Promise) {
        value.then(resolve, reject);
      } else {
        resolve(value);
      }
    });
  };
  Promise.reject = function (reason) {
    return new Promise((resolve, reject) => {
      reject(reason);
    });
  };

  Promise.all = function (promises) {
    // 遍历promises数组 获取每个的结果
    return new Promise((resolve, reject) => {
      // 为了保证全部成功返回的values数组跟promises 位置是对应
      // 使用resolveCount 固定位置
      // 因为每个promise是不一定那个先成功的，位置很难都确定
      let resolveCount = 0;
      let values = new Array(promises.length);

      promises.forEach((p, index) => {
        // 当数组内有不是promise的项， 直接Promise.resolve(p) 变成promise
        Promise.resolve(p).then(
          (value) => {
            resolveCount++;
            values[index] = value;

            if (resolveCount === promises.length) {
              resolve(values);
            }
          },
          (reason) => {
            reject(reason);
          }
        );
      });
    });
  };

  Promise.race = function (promises) {
    return new Promise((resolve, reject) => {
      // 只根据第一个promise调用后的状态
      promises.forEach((p, index) => {
        Promise.resolve(p).then(
          (value) => {
            resolve(value);
          },
          (reason) => {
            reject(reason);
          }
        );
      });
    });
  };

  // 指定的时间后产生结果
  Promise.resolveDelay = function (value, time) {
    setTimeout(() => {
      Promise.resolve(value);
    }, time);
  };

  Promise.rejectDelay = function (reason) {
    setTimeout(() => {
      Promise.reject(reason);
    }, time);
  };

  window.Promise = Promise;
})(window);
