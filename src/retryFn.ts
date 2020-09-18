/**
 * 重复执行目标func直到func 返回resolve,或者达到设定的尝试执行次数
 * @param func 目标方法
 * @param options.count 尝试执行次数 默认：5
 * @param options.retryFence 重试时间间隔, 默认 1500 毫秒
 * @param options.onceCallback 每次执行的回调
 * 
 * @example
 * ```typescript
 * retryFn(() => new Promise((resolve, reject) => {
 *     const value = Math.random();
 *     if (value > 0.9) {
 *         resolve(value);
 *     } else {
 *         reject(value);
 *     }
 * }))
 *     .then(result => {
 *         // do somethin
 *     })
 *     .catch(err => {
 *         // do somethin
 *     });
 * ```
 */
export function retryFn<T>(
    func: () => Promise<T>,
    options?: {
        count?: number,
        retryFence?: number,
        onceCallback?: (index: number) => void
    }): Promise<T> {
    const { count = 5, retryFence = 1500, onceCallback: onceTryCallback } = options || {};
    const promis = new Promise<any>((resolve, reject) => {
        let retryCount = 0;
        const tryFn = () => {
            retryCount++;
            if (onceTryCallback != null) onceTryCallback(retryCount);
            func()
                .then((res) => resolve(res))
                .catch((err) => {
                    if (retryCount >= count) {
                        reject(err);
                    } else {
                        setTimeout(() => tryFn(), retryFence);
                    }
                });
        };
        tryFn();
    });
    return promis;
}
