/**
 * 将一组任务分割到多个Event cycle执行
 * @param tasks 任务
 * @param options 分割参数等
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
