/**
 * 将多条任务分割到多个小组中执行。
 * @param tasks 任务
 * @param options.batchCount 分组的数量, 默认: 10
 * @param options.waitTime 组任务执行间隔, 默认: 0
 * @param options.onprogress 每个任务完成后回调，返回总任务进度。() 
 * 
 * 
 * @description <br/> 
 * <br/> 
 * 可用于：耗时函数拆分、削峰等
 * 
 * @example
 * ```typescript
 * const tasks = [...Array(100)].map(item => {
 *     return () => new Promise((resolve, reject) => {
 *         setTimeout(() => resolve(1), 1000);
 *     });
 * });
 * executePromisesByBatch(tasks, {
 *     onprogress: (progress, result) => {
 *         console.log("progress", progress, result);
 *     }
 * });
 * 
 * ```
 */
export async function executePromisesByBatch<T>(
    tasks: (() => Promise<T>)[],
    options?: {
        batchCount?: number,
        waitTime?: number,
        onprogress?: (progress: number, result?: T) => void
    }
): Promise<T[]> {
    const { batchCount = 10, waitTime = 0, onprogress } = options || {};
    const count = Math.ceil(tasks.length / batchCount);
    let results: T[] = [];
    for (let i = 0; i < count; i++) {
        const currentTasks = tasks.slice(i * batchCount, Math.min((i + 1) * batchCount, tasks.length));
        await new Promise<void>((resolve, reject) => {
            Promise.all(currentTasks.map(item => {
                return item()
                    .then((res) => {
                        results.push(res);
                        onprogress?.(results.length / tasks.length, res);
                    })
            }))
                .then(() => {
                    setTimeout(() => resolve(), waitTime);
                })
                .catch((err) => reject(err));
        });
    }
    return results;
}