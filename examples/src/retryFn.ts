import { retryFn } from "@mtgoo/ctool";

let func = () => {
    return new Promise((resolve, reject) => {
        let a = Math.random();
        a > 0.9 ? resolve(a) : reject(a);
    })
}

retryFn(func, {
    onceTryBefore: (index) => console.log("开始执行", index, new Date().toLocaleString()),
    onceTryCallBack: (index, result, err) => console.log("单次执行结果:", index, result, err),
    retryFence: 2000,
})
    .then(result => {
        console.log(result);
    })
    .catch(err => {
        console.error("error", err);
    });
