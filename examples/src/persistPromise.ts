import { PersistPromise } from '@mtgoo/ctool';

//原始任务
var task = () => {
    return new Promise<number>((resolve) => {
        setTimeout(() => {
            resolve(Math.random())
        }, 1000)
    })
}
console.log("----------------example a: -------------------------");
//任务执行中时复用结果，执行结束时候重新执行
const action = PersistPromise.create(task);

let firstResult: number;
let example_a = Promise.all([action(), action(), action()]).then((results) => {
    let bequal = results[0] == results[1] && results[1] == results[2];
    firstResult = results[0];
    console.log("result be equal", bequal, firstResult);
}).then(() => {
    return action().then((result) => {
        console.log("再次执行产生新值", result != firstResult, result);
    })
})




example_a.then(() => {
    console.log("----------------example b: -------------------------");

    //原始任务
    var task = () => {
        return new Promise<number>((resolve) => {
            setTimeout(() => {
                resolve(Math.random())
            }, 1000)
        })
    }
    //使用dropcondition让结果一直复用;
    let persistTask = PersistPromise.create(task, () => Promise.reject());
    let intervalTask = setInterval(async () => {
        let result = await persistTask();
        console.log("result一直为：", result);
    }, 1000);
    setTimeout(() => clearInterval(intervalTask), 5000);
})

