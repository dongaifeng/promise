(function (window) {
  // excutor:执行器寒素 同步执行
  function Promise(excutor) {

    const PENDING = 'pending'
    const RESOLVED = 'resolved'
    const REJECTED = 'rejected'

    const self = this
    self.status = PENDING
    self.data = undefined
    self.callbacks = [] //  {onResolved(){}, onRejected(){}}

    // 同步执行 执行器
    try {
      excutor(resolve, reject) // 监测执行抛出错误 直接 reject
    } catch (error) {
      reject(error)
    }

    function resolve(value) {
      if (self.status !== PENDING) return false
      // 1 改变状态
      self.status = RESOLVED
      //  2保存value 
      self.data = value
      //  3执行callback函数 异步执行
      if (self.callbacks.length > 0) {
        setTimeout(() => {
          self.callbacks.forEach(obj => {
            obj.onResolved(value)
          });
        })
      }


    }



    function reject(reason) {
      if (self.status !== PENDING) return false
      self.status = REJECTED
      self.data = reason
      if (self.callbacks.length > 0) {
        setTimeout(() => {
          self.callbacks.forEach(obj => {
            obj.onRejected(reason)
          });
        })
      }



    }
  }




  Promise.prototype.then = function (onResolved, onRejected) {
    const self = this

    // 指定默认的onRejected
    onRejected = typeof onRejected === 'function' ? onRejected : reason => {throw reason}
    // 指定默认 onResolved  向后传递value
    onResolved = typeof onResolved === 'function' ? onResolved : value => value 
    // 用户调用then方法时，返回一个新的promise对象
    return new Promise((resolve, reject) => {

      // 提取函数 根据 用户调用then方法时 执行的参数函数，来判断返回新的promise对象的状态
      function handle(callback){
        try {
          const result = callback(self.data)
           // 这里要分析 onResolved 的返回值，有几种情况
          // 1 抛出异常 返回的新的promise对象 状态应该是reject
          // 2 如果返回的promise，要根据promise的状态，来确定返回新的promise状态
          // 3 不是promise对象 就是resolve 
          if (result instanceof Promise) {
            // result.then(value => { resolve(value) }, reason => { reject(reason) }) // 2
            result.then(resolve, reject)
          } else {
            resolve(result)  // 3
          }
        } catch (error) {
          // 1 的情况
          reject(error)
        }
      }


      // TODO: PENDING
      if (self.status === 'pending') {

        self.callbacks.push({
          onResolved() {
            handle(onResolved)
          },

          onRejected() {
            
            handle(onRejected)
          }
        })


      } else if (self.status === RESOLVED) {
        setTimeout(() => {
         
         
          handle(onResolved)

        })

      } else {
        setTimeout(() => {
          handle(onRejected)
        })
      }
    })


  }
  Promise.prototype.catch = function (onRejected) {
    return this.then(undefined, onRejected)
  }

  Promise.resolve = function (value) {

  }
  Promise.reject = function (reason) {

  }
  Promise.all = function (promises) {

  }
  Promise.race = function (promises) {

  }





  window.Promise = Promise
})(window)