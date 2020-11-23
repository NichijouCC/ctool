import { tasksSplite } from '@mtgoo/ctool';

const tasks = [...Array(100)].map(item => {
    return () => new Promise<number>((resolve, reject) => {
        setTimeout(() => resolve(1), 1000);
    });
});
tasksSplite(tasks, {
    onprogress: (progress, result) => {
        console.log("progress", progress, result);
    }
});