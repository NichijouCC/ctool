import { OncePromise, TaskPromise } from "./exposedPromise";

export class TaskPool {
    //执行中数量
    private doingCount = 0;
    //并发执行最大数量，默认：5
    maxConcurrency: number;
    //其中一个任务失败是否导致pool中所有任务失败，默认：false
    errBreak: boolean;
    constructor(options?: { maxConcurrency?: number, errBreak?: boolean }) {
        this.maxConcurrency = options?.maxConcurrency ?? 5;
        this.errBreak = options?.errBreak ?? false;
    }
    private tasks: { task: () => Promise<any>, onEnd: TaskPromise<any> }[] = [];
    push<T = any>(task: () => Promise<T>) {
        let onEnd = OncePromise.create<T>();
        this.tasks.push({ task, onEnd });
        this.execute();
        return onEnd.ins
    }

    pushArray<T = any>(taskArr: (() => Promise<T>)[]) {
        let arr = taskArr.map(el => {
            let onEnd = OncePromise.create<T>();
            this.tasks.push({ task: el, onEnd });
            return onEnd.ins
        });
        this.execute();
        return Promise.all(arr)
    }

    private execute() {
        if (this.doingCount < this.maxConcurrency) {
            let task = this.tasks.shift();
            if (task != null) {
                this.doingCount++;
                task.task()
                    .then((result) => task.onEnd.resolve(result))
                    .catch(err => {
                        task.onEnd.reject(err);
                        if (this.errBreak) {
                            this.tasks.forEach(el => el.onEnd.reject(new Error("other task in pool failed")))
                            this.tasks = [];
                        }
                    })
                    .finally(() => {
                        this.doingCount--;
                        this.execute();
                    })
            }
        }
    }
}