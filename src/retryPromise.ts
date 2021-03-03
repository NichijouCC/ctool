/**
 * 重复执行目标任务直到任务 返回resolve,或者达到设定的尝试执行次数
 * @param func 目标任务
 * @param options.count 尝试执行次数 默认：5
 * @param options.retryFence 重试时间间隔, 默认 1500 毫秒
 * @param options.onceCallback 每次执行的回调
 * 
 * @example
 * ```typescript
 * retryPromise(() => new Promise((resolve, reject) => {
 *     const value = Math.random();
 *     if (value > 0.9) {
 *         resolve(value);
 *     } else {
 *         reject(value);
 *     }
 * }), {
 *     onceTryBefore: (index) => console.log("开始执行", index),
 *     onceTryCallBack: (index, result, err) => console.log("单次执行结果:", index, result, err)
 * })
 *     .then(result => {
 *         // do somethin
 *     })
 *     .catch(err => {
 *         // do somethin
 *     });
 * 
 * ```
 */
export function retryPromise<T>(
    func: () => Promise<T>,
    options?: {
        count?: number,
        retryFence?: number,
        onceTryBefore?: (index: number) => void,
        onceTryCallBack?: (index: number, result: T, error?: any) => void,
    }): Promise<T> {
    const { count = 5, retryFence = 1500, onceTryBefore, onceTryCallBack } = options || {};
    const task = new Promise<any>((resolve, reject) => {
        let retryCount = 0;
        const tryFn = () => {
            retryCount++;
            if (onceTryBefore != null) onceTryBefore(retryCount);
            func()
                .then((res) => {
                    onceTryCallBack?.(retryCount, res, undefined);
                    resolve(res);
                })
                .catch((err) => {
                    onceTryCallBack?.(retryCount, undefined, err);
                    if (retryCount >= count) {
                        reject(err);
                    } else {
                        setTimeout(() => tryFn(), retryFence);
                    }
                });
        };
        tryFn();
    });
    return task;
}
