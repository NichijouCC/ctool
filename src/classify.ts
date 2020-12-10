/**
 * 数据分类
 */
export class Classify {
    /**
     * 将数组转为多级MAP
     * @param arr 目标数组
     * @param args 不定参数
     * 
     * @example
     * ```
     * let a = Classify.arrayToMap(
     *     [{ a: 1, b: 2 }, { a: 2, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 2 }, { a: 1, b: 3 }, { a: 1, b: 2 }],
     *     { itemToKey: (item) => item.a }, { itemToKey: (item) => item.b }
     * );
     * console.log(a);
     * // Map {
     * //     1 => Map { 2 => [ [Object], [Object] ], 3 => [ [Object] ] },
     * //     2 => Map { 2 => [ [Object] ], 3 => [ [Object] ] },
     * //     3 => Map { 2 => [ [Object] ] }
     * //   }
     * ```
     */
    static arrayToMap<T extends object, K extends number | string | object, U extends object>(
        arr: T[],
        ...args: {
            itemToKey: (item: T) => K,
            keyTransformt?: (item: K) => U
        }[]) {
        let [condition, ...rest] = args;
        if (condition == null) return arr;
        let { itemToKey, keyTransformt } = condition;
        let dic = new Map<any, any>();
        arr.forEach(item => {
            let key = itemToKey(item);
            if (dic.has(key)) {
                dic.get(key).push(item);
            } else {
                dic.set(key, [item]);
            }
        });
        if (rest.length != 0) {
            dic.forEach((value, key) => {
                if (keyTransformt != null) {
                    dic.set(keyTransformt(key), this.arrayToMap(value, ...rest))
                } else {
                    dic.set(key, this.arrayToMap(value, ...rest))
                }
            })
        }
        return dic;
    }

    /**
     * 将数组转为多级数组
     * @param arr 目标数组
     * @param args 不定参数
     * 
     * @example
     * 
     * ```
     * let b = Classify.arrayToArray(
     *     [{ a: 1, b: 2 }, { a: 2, b: 2 }, { a: 2, b: 3 }, { a: 2, b: 3, c: 1 }],
     *     { itemToKey: (item) => item.a },
     *     { itemToKey: (item) => item.b });
     * console.log(JSON.stringify(b));
     * // [{"key":1,"child":[{"key":2,"child":[{"a":1,"b":2}]}]},{"key":2,"child":[{"key":2,"child":[{"a":2,"b":2}]},{"key":3,"child":[{"a":2,"b":3},{"a":2,"b":3,"c":1}]}]}]
     * ```
     * 
     */
    static arrayToArray<T extends object, K extends number | string | object, U extends object>(
        arr: T[],
        ...args: {
            itemToKey: (item: T) => K,
            keyTransformt?: (item: K) => U
        }[]) {

        let [condition, ...rest] = args;
        if (condition == null) return arr;
        let { itemToKey, keyTransformt } = condition;
        let arrLayer: { key: K, child: any[] }[] = [];
        arr.forEach(item => {
            let key = itemToKey(item);
            let target = arrLayer.find(child => child.key == key);
            if (target != null) {
                target.child.push(item);
            } else {
                arrLayer.push({ key, child: [item] });
            }
        });
        if (rest.length != 0) {
            arrLayer.forEach((item, index) => {
                item.child = this.arrayToArray(item.child, ...rest);
                if (keyTransformt != null) {
                    arrLayer[index] = { ...keyTransformt(item.key), child: item.child } as any;
                }
            });
        }
        return arrLayer;
    }
}