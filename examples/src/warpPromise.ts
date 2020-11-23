import { WrapPromise } from '@mtgoo/ctool';


let task = () => {
    return new Promise<number>((resolve, reject) => {
        let a = Math.random();
        a > 0.5 ? resolve(a) : reject(a);
    })
}

let main = async () => {
    let [err, result] = await WrapPromise(task);
    console.log("error", err)
    console.log("result", result);
}

main();