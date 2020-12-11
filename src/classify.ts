/**
 * 数据分类
 */
export class Classify {
    /**
     * 将数组转为多级MAP
     * @description 分为几级由不定参数个数决定
     * @param arr 目标数组
     * @param args 不定参数，对应每一层级的key
     * 
     * @example
     * ```
     * let newArr = Classify.arrayToMap(
     *     [{ a: 1, b: 1 }, { a: 1, b: 3 }, { a: 2, b: 2 }, { a: 3, b: 2 }, { a: 4, b: 3 }, { a: 5, b: 3, c: 4 }, { a: 1, b: 3, c: 5 }],
     *     item => item.a,
     *     item => item.b,
     *     item => item.c
     * )
     * console.log(newArr);
     * // Map {
     * //     1 => Map {
     * //       1 => Map { undefined => [Array] },
     * //       3 => Map { undefined => [Array], 5 => [Array] }
     * //     },
     * //     2 => Map { 2 => Map { undefined => [Array] } },
     * //     3 => Map { 2 => Map { undefined => [Array] } },
     * //     4 => Map { 3 => Map { undefined => [Array] } },
     * //     5 => Map { 3 => Map { 4 => [Array] } }
     * //   }
     * ```
     */
    static arrayToMap<T extends object, K extends number | string | Object>(
        arr: T[],
        ...itemToKey: ((item: T) => K)[]) {
        let [currentLayer, ...rest] = itemToKey;
        let dic = new Map<K, any>();
        arr.forEach(item => {
            let key = currentLayer(item);
            if (dic.has(key)) {
                dic.get(key).push(item);
            } else {
                dic.set(key, [item]);
            }
        });

        if (rest.length != 0) {
            dic.forEach((value, key) => {
                dic.set(key, this.arrayToMap(value, ...rest))
            })
        }
        return dic;
    }

    /**
     * 将数组转为多级数组
     * @description 分为几级由不定参数个数决定
     * @param arr 目标数组
     * @param args 不定参数
     * @param args.itemToKey 对应层级分组的key值
     * @param args.keyTransformt 将对应层级{key,item}转换为其他结构
     * 
     * @example
     * 
     * ```
     * let b = Classify.arrayToArray(
     *     [{ a: 1, b: 2 }, { a: 2, b: 2 }, { a: 2, b: 3 }, { a: 2, b: 3, c: 1 }],
     *     { itemToKey: (item) => item.a, layerTransformater: (key,item) => { return { newKey: key, layer: 1 } } },
     *     { itemToKey: (item) => item.b, layerTransformater: (key,item) => { return { newKey: key, layer: 2 } } });
     * console.log(JSON.stringify(b));
     * //[{"newKey":1,"layer":1,"child":[{"newKey":2,"layer":2,"child":[{"a":1,"b":2}]}]},{"newKey":2,"layer":1,"child":[{"newKey":2,"layer":2,"child":[{"a":2,"b":2}]},{"newKey":3,"layer":2,"child":[{"a":2,"b":3},{"a":2,"b":3,"c":1}]}]}
     * ```
     * 
     */
    static arrayToArray<T extends object, K extends number | string | object, U extends object>(
        arr: T[],
        ...args: {
            itemToKey: (item: T) => K,
            layerTransformater?: (key: K, item?: T) => U
        }[]): ({ key?: K, child: any[] } & Partial<U>)[] {

        let [condition, ...rest] = args;
        if (condition == null) return arr as any;
        let { itemToKey, layerTransformater } = condition;
        let arrLayer: { key: K, item: T, child: any[] }[] = [];
        arr.forEach(item => {
            let key = itemToKey(item);
            let target = arrLayer.find(child => child.key == key);
            if (target != null) {
                target.child.push(item);
            } else {
                arrLayer.push({ key, item, child: [item] });
            }
        });
        if (layerTransformater != null) {
            arrLayer.forEach((item, index) => {
                arrLayer[index] = { ...layerTransformater(item.key, item.item), child: item.child } as any;
            })
        }

        if (rest.length != 0) {
            arrLayer.forEach((item, index) => {
                item.child = this.arrayToArray(item.child, ...rest);
            });
        }
        return arrLayer as any;
    }
}