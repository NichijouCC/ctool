import { EventEmitter } from "./eventEmitter";

interface IPrivateEvents {
    setAtt: { att: string, newValue: any, oldValue: any }
}
type IAttEvents<T extends object> = {
    [key in keyof T]: { newValue: any, oldValue: any }
}
export type IProxyEvents<T extends object = {}, K extends object = {}> = IPrivateEvents & IAttEvents<T> & K;
/**
 * 可监听数据对象
 * 
 * @example
 * ```
 * //监听target变换
 * let target={x:2}
 * let observe=Observable(target);
 * observe.on("x",(ev)=>{
 *     console.log(ev.newValue,ev.oldValue);
 * })
 * 
 * observe.x=23;
 * ```
 */
export class ObservableData<T extends object = {}, K extends object = {}> extends EventEmitter<IProxyEvents<T, K>> {
    private _target: object;
    private constructor(target:object) { 
        super();
        this._target=target;
    }
    /**
     * 创建可监听对象，可设置对象自定义的事件类型
     * @param data 
     */
    static create<T extends object, K extends object={}>(data: T): T & ObservableData<T, K> {
        let container = new ObservableData<T>(data);
        let proxy = new Proxy(container, {
            set: function (obj, prop: string, value: any) {
                if(obj._target){
                    let oldValue=(obj._target as any)[prop];
                    (obj._target as any)[prop] = value;
                    container.emit("setAtt", { att: prop, newValue: value, oldValue});
                    (container as any).emit(prop, { newValue: value, oldValue });
                    return true;
                }

            }
        });
        return proxy as any;
    }
}

export function Observable<T extends object>(target:T){
    return ObservableData.create(target);
}