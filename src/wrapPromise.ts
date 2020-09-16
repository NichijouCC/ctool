/**
 * 将promise结果包装为[error,T]
 * @param func 
 */
export function WrapPromise<T>(func: () => Promise<T>): Promise<[any, T]> {
    return new Promise<[any, T]>((resolve, reject) => {
        func()
            .then((data) => {
                resolve([null, data]);
            })
            .catch(err => {
                resolve([err, null]);
            });
    });
}
