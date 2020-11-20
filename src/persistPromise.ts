/**
 * 复用promise结果直到promise结束；
 * 触发 dropCondition 即解除复用，默认dropCondition为func 结束。
 * 
 * 
 * @example
 * ```
 * const action = PersistPromise.create((): Promise<number> => {
 *     return new Promise((resolve, reject) => {
 *         setTimeout(() => resolve(Math.random()), 100)
 *     })
 * });
 * Promise.all([action(), action(), action()]).then((results) => {
 *     let bequal = results[0] == results[1] && results[1] == results[2];
 *     console.log("result be equal", bequal);
 * })
 * ```
 */
export class PersistPromise {
    private static doingtasks = new Map();
    static create<T = any>(func: () => Promise<T>, dropCondition?: () => Promise<any>) {
        return (): Promise<T> => {
            if (this.doingtasks.has(func)) {
                return this.doingtasks.get(func);
            } else {
                let task = func();
                this.doingtasks.set(func, task);
                if (dropCondition) {
                    dropCondition().then(() => {
                        this.doingtasks.delete(func);
                    })
                } else {
                    task.finally(() => {
                        this.doingtasks.delete(func);
                    })
                }
                return task;
            }
        }
    }
}

