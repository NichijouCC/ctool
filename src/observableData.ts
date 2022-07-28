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
    private constructor(target: object) {
        super();
        this._target = target;
    }
    /**
     * 创建可监听对象，可设置对象自定义的事件类型
     * @param data 
     */
    static create<T extends object, K extends object = {}>(data: T): T & ObservableData<T, K> {
        let container = new ObservableData<T>(data);
        let proxy = new Proxy(container, {
            set: function (obj, prop: string, value: any) {
                if (obj._target) {
                    let oldValue = (obj._target as any)[prop];
                    (obj._target as any)[prop] = value;
                    container.emit("setAtt", { att: prop, newValue: value, oldValue });
                    (container as any).emit(prop, { newValue: value, oldValue });
                    return true;
                }
            },
            get: function (obj, prop: string) {
                return (obj._target as any)?.[prop] ?? (obj as any)[prop];
            }
        });
        return proxy as any;
    }
}

export function Observable<T extends object>(target: T) {
    return ObservableData.create(target);
}



namespace Private {
    export const proxyBro = Symbol("_proxy_bro");
}
/**
 * obj的属性可以被递归监听, 即修改obj子属性的子属性, obj会可以触发修改事件
 * @example
 * ```
 * let target = { x: 2, y: { z: 1 } }
 * let observe = RecurveObservable(target);
 * Watch(observe, "y", (newValue) => {
 *     console.log(newValue);
 * });
 * target.y.z = 3;
 * ```
 */
export function RecurveObservable<T extends object>(obj: T): T {
    let creatProxyBro = (obj: object, notifyParent?: () => void, props?: string) => {
        let proxy = new Proxy(obj, {
            set: (target, props, value) => {
                // console.log(`set ${props.toString()} ${value}`);
                let bro: { proxy: any, eventEmitter: EventEmitter } = Reflect.get(target, Private.proxyBro);
                if (typeof value == "object") {
                    creatProxyBro(value, () => {
                        bro.eventEmitter.emit(props as any, value);
                    }, props as any);
                };
                Reflect.set(target, props, value);
                bro.eventEmitter.emit(props as any, value);
                notifyParent?.();

                return true;
            },
            get: (target, props) => {
                let value = Reflect.get(target, props);
                if (props == Private.proxyBro) return value;

                // console.log(`get ${props.toString()}`);
                let parentBro: { proxy: any, eventEmitter: EventEmitter } = Reflect.get(target, Private.proxyBro);

                let bro: { proxy: any, eventEmitter: EventEmitter } = Reflect.get(value, Private.proxyBro);
                if (bro == null && typeof value == "object") {
                    creatProxyBro(value, () => {
                        // console.log("notify-parent", props);
                        parentBro.eventEmitter.emit(props as any, value);
                    }, props as any);
                    bro = Reflect.get(value, Private.proxyBro);
                }
                return value?.[Private.proxyBro]?.proxy ?? value
            }
        });
        Reflect.set(obj, Private.proxyBro, { proxy, eventEmitter: new EventEmitter() });
        return proxy;
    }
    return creatProxyBro(obj) as any;
}

export function Watch<T extends object, P extends keyof T>(target: T, props: P, callback: (newValue: T[P]) => void) {
    let bro: { proxy: any, eventEmitter: EventEmitter } = Reflect.get(target, Private.proxyBro);
    bro.eventEmitter.on(props as any, callback)
}
