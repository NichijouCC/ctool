/**
 * 复用promise  
 * @description <br/>
 * <br/>
 * 默认dropCondition为func 结束；  
 * 触发 dropCondition （promise.then）即解除复用，(promise.reject)即无限复用；  
 * 
 * 
 * 
 * 
 * @example
 * ```
 * //example1: 任务执行中时复用结果，执行结束时候重新执行
 * const action = PersistPromise.create(() => {
 *     return new Promise<number>((resolve, reject) => {
 *         setTimeout(() => resolve(Math.random()), 100)
 *     })
 * });
 * Promise.all([action(), action(), action()]).then((results) => {
 *     let beEqual = results[0] == results[1] && results[1] == results[2];
 *     console.log("result be equal", beEqual);
 * })
 * 
 * 
 * // example2: task任务为修改a，persistTask保持task仅仅执行一次，复用结果
 * let a = 0;
 * let changA_task = () => {
 *     return new Promise((resolve) => {
 *         setTimeout(() => {
 *             a++;
 *             resolve()
 *         }, 1000)
 *     })
 * }
 * 
 * let persistTask = PersistPromise.create(changA_task, () => Promise.reject());
 * setInterval(async () => {
 *     await persistTask();
 *     console.log("a 一直为1", a);
 * }, 1000);
 * 
 * 
 * ```
 */
export class PersistPromise {
    private static doingTasks = new Map();
    static create<T = any>(func: () => Promise<T>, dropCondition?: () => Promise<any>) {
        return (): Promise<T> => {
            if (this.doingTasks.has(func)) {
                return this.doingTasks.get(func);
            } else {
                let task = func();
                this.doingTasks.set(func, task);
                if (dropCondition) {
                    dropCondition()
                        .then(() => {
                            this.doingTasks.delete(func);
                        })
                        .catch(() => { })
                } else {
                    task.finally(() => {
                        this.doingTasks.delete(func);
                    })
                }
                return task;
            }
        }
    }
}

