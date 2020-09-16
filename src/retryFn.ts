/**
 * 重复执行promise方法多次
 * @param options 
 */
export function retryFn<T>(
    options: {
        func: () => Promise<T>,
        count?: number,
        retryFence?: number,
        onceCallback?: (index: number) => void
    }): Promise<T> {
    const { func, count = 5, retryFence = 1500, onceCallback: onceTryCallback } = options;
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
