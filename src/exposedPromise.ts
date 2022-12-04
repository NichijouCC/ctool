/**
 * 
 * 将promise 任务的完成和失败控制句柄暴露在外部
 * @example
 * ```
 * let task_a = ExposedPromise.create();
 * let task_b = ExposedPromise.create();
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
export class ExposedPromise<T = void>{
    resolve: (value: T) => void;
    reject: (error: any) => void;
    ins: Promise<T>;

    private constructor() { }
    static create<T = void>() {
        let newTask = new ExposedPromise<T>();
        newTask.ins = new Promise((resolve, reject) => {
            newTask.resolve = resolve;
            newTask.reject = reject;
        });
        return newTask;
    }
}


export class OncePromise<T = void>{
    resolve: (value: T) => void;
    reject: (error: any) => void;
    ins: Promise<T>;
    private beExecuted = false
    private constructor() { }
    static create<T = void>() {
        let newTask = new OncePromise<T>();
        newTask.ins = new Promise((resolve, reject) => {
            newTask.resolve = (result) => {
                if (!newTask.beExecuted) {
                    newTask.beExecuted = true;
                    resolve(result);
                }
            };
            newTask.reject = (err) => {
                if (!newTask.beExecuted) {
                    newTask.beExecuted = true;
                    reject(err);
                }
            };
        });
        return newTask;
    }
}

export { ExposedPromise as TaskPromise };