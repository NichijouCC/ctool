/**
 * 对象池
 * 
 * @description
 * 避免频繁gc
 * 
 * 
 * @example
 * 
 * ```
 * //初始化池子
 * let pool = new ObjectPool({
 *     create: () => new Float32Array(4),
 *     reset: (item: Float32Array) => {
 *         for (let i = 0; i < item.length; i++) {
 *             item[i] = 0;
 *         }
 *     }
 * });
 * 
 * //创建
 * let ins = pool.create();
 * 
 * //回收
 * pool.recycle(ins);
 * 
 * //清空池子
 * pool.clear();
 * ```
 */
export class ObjectPool<T> {
    private _create: () => T;
    private _reset: (obj: T) => void;
    private _pool: T[] = [];

    get size() { return this._pool.length }
    constructor(
        options: {
            create: () => T,
            reset: (obj: T) => void,
            initSize?: number,
        }) {
        this._create = options.create;
        this._reset = options.reset;
        if (options.initSize != null) {
            this._pool = [...new Array(options.initSize)].map(item => this._create())
        }
    }
    /**
     * 创建对象
     */
    create() {
        if (this._pool.length == 0) {
            return this._create();
        } else {
            let item = this._pool.shift();
            this._reset(item);
            return item;
        }
    }
    /**
     * 回收对象
     * @param obj 
     */
    recycle(obj: T) {
        this._pool.push(obj);
    }

    /**
     * 清空池子
     */
    clear() {
        this._pool = [];
    }
}

//初始化池子
let pool = new ObjectPool({
    create: () => new Float32Array(4),
    reset: (item: Float32Array) => {
        for (let i = 0; i < item.length; i++) {
            item[i] = 0;
        }
    }
});

//创建
let ins = pool.create();

//回收
pool.recycle(ins);