import { ObjectPool } from '@mtgoo/ctool'

//初始化池子
let pool = new ObjectPool({
    create: () => new Float32Array(4),
    reset: (ins) => {
        ins[0] = 0;
        ins[1] = 0;
        ins[2] = 0;
        ins[3] = 0;
    }
});

//创建
let ins = pool.create();

//回收
pool.recycle(ins);