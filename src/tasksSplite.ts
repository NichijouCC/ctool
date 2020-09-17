/**
 * 将多条任务分割到多个Event cycle 执行。
 * @param tasks 任务
 * @param options.groupCount 分组的数量, 默认: 10
 * @param options.waitTime 组任务执行间隔, 默认: 0
 * @param options.onprogress 每组任务完成后回调，返回 { progress: 进度, groupResult: 组任务结果 }
 * 
 * 
 * @description
 * 可用于：耗时函数拆分、削峰等
 * 
 * @example
 * ```typescript
 * const tasks = new Array(100000).map(item => {
 *     return () => new Promise((resolve, reject) => {
 *         setTimeout(() => resolve(1), 1000);
 *     });
 * });
 * tasksSplite(tasks, {
 *     onprogress: (info) => {
 *         console.log("progress", info.progress);
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
        onprogress?: (processInfo: { progress: number, groupResult: T[] }) => void
    }
): Promise<T[]> {
    const { groupCount = 10, waitTime = 0, onprogress } = options || {};
    const batchCount = Math.ceil(tasks.length / groupCount);
    let results: T[] = [];
    for (let i = 0; i < batchCount; i++) {
        const currentTasks = tasks.slice(i * groupCount, Math.min((i + 1) * groupCount, tasks.length));
        await new Promise((resolve, reject) => {
            Promise.all(currentTasks.map(item => item()))
                .then((res) => {
                    if (onprogress) {
                        onprogress({ progress: i / batchCount, groupResult: res });
                    }
                    setTimeout(() => {
                        results = results.concat(res);
                        resolve(res);
                    }, waitTime);
                })
                .catch((err) => reject(err));
        });
    }
    return results;
}
