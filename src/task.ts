/**
 * 
 * 将promise 任务的完成和失败控制句柄暴露在外部
 * @example
 * ```
 * let task_a = Task.create();
 * let task_b = Task.create();
 * 
 * let taskGroup = Promise.all([task_a.ins, task_b.ins]);
 * taskGroup.then(() => {
 *     console.log("all finish!");
 * });
 * 
 * task_a.ins.then(() => {
 *     console.log("task a finish");
 * })
 * 
 * task_b.ins.then(() => {
 *     console.log("task b finish");
 * })
 * 
 * setTimeout(() => task_a.resolve(), 1000);
 * setTimeout(() => task_b.resolve(), 3000);
 * ```
 */
export class Task<T = void>{
    resolve: (value: T) => void;
    reject: () => void;
    ins: Promise<T>;

    static create<T = void>() {
        let newTask = new Task<T>();
        newTask.ins = new Promise((resolve, reject) => {
            newTask.resolve = resolve;
            newTask.reject = reject;
        });
        return newTask;
    }
}