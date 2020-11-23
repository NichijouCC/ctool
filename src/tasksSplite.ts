/**
 * 将多条任务分割到多个Event cycle 执行。
 * @param tasks 任务
 * @param options.groupCount 分组的数量, 默认: 10
 * @param options.waitTime 组任务执行间隔, 默认: 0
 * @param options.onprogress 每个任务完成后回调，返回  progress: 进度, result: 任务结果 
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
 * tasksSplite(tasks, {
 *     onprogress: (progress, result) => {
 *         console.log("progress", progress, result);
 *     }
 * });
 * 
 * ```
 */
export async function tasksSplite<T>(
    tasks: (() => Promise<T>)[],
    options?: {
        groupCount?: number,
        waitTime?: number,
        onprogress?: (progress: number, result?: T) => void
    }
): Promise<T[]> {
    const { groupCount = 10, waitTime = 0, onprogress } = options || {};
    const batchCount = Math.ceil(tasks.length / groupCount);
    let results: T[] = [];
    for (let i = 0; i < batchCount; i++) {
        const currentTasks = tasks.slice(i * groupCount, Math.min((i + 1) * groupCount, tasks.length));
        await new Promise<void>((resolve, reject) => {
            Promise.all(currentTasks.map(item => {
                return item()
                    .then((res) => {
                        results.push(res);
                        onprogress?.(results.length / tasks.length, res);
                    }).catch(ee => console.error(ee))
            }))
                .then(() => {
                    setTimeout(() => resolve(), waitTime);
                })
                .catch((err) => reject(err));
        });
    }
    return results;
}