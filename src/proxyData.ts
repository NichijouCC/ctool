import { EventEmitter } from "./eventEmitter";

interface IprivateEvents {
    setAtt: { att: string, newValue: any, oldValue: any }
}
type IattEvents<T extends object> = {
    [key in keyof T]: { newValue: any, oldValue: any }
}
export type IproxyEvents<T extends object = {}, K extends object = {}> = IprivateEvents & IattEvents<T> & K;
/**
 * 数据对象代理
 */
export class ProxyData<T extends object = {}, K extends object = {}> extends EventEmitter<IproxyEvents<T, K>> {
    private constructor() { super(); }
    /**
     * 创建
     * @param data 目标对象
     */
    static create<T extends object>(data: T): T & ProxyData<T> {
        let container = new ProxyData<T>();
        Object.keys(data).forEach(item => {
            if ((data as any)[item] != null) {
                (container as any)[item] = (data as any)[item];
            }
        });
        let proxy = new Proxy(container, {
            set: function (obj, prop: string, value: any) {
                container.emit("setAtt", { att: prop, newValue: value, oldValue: (obj as any)[prop] });
                (container as any).emit(prop, { newValue: value, oldValue: (obj as any)[prop] });
                (obj as any)[prop] = value;
                return true;
            }
        });
        return proxy as any;
    }
    /**
     * 创建代理对象，同时设置代理对象自定义的事件类型
     * @param data 
     */
    static createWithEvents<T extends object, K extends object>(data: T): T & ProxyData<T, K> {
        return this.create(data)
    }
}