import { EventEmitter } from "./eventEmitter";

interface IprivateEvents {
    setAtt: { att: string, newValue: any, oldValue: any }
}
type IattEvents<T extends object> = {
    [key in keyof T]: { newValue: any, oldValue: any }
}
export type IproxyEvents<T extends object = {}, K extends object = {}> = IprivateEvents & IattEvents<T> & K;
/**
 * 可监听数据对象
 */
export class ObservableData<T extends object = {}, K extends object = {}> extends EventEmitter<IproxyEvents<T, K>> {
    private _target: this;
    constructor() { 
        super();
        this._target=new Proxy<any>(this, {
            set: function (obj, prop: string, value: any) {
                let oldValue=(obj as any)[prop];
                (obj as any)[prop] = value;
                this.emit("setAtt", { att: prop, newValue: value, oldValue});
                this.emit(prop, { newValue: value, oldValue });
                return true;
            }
        });
    }
    /**
     * 创建可监听对象，可设置对象自定义的事件类型
     * @param data 
     */
    static create<T extends object, K extends object={}>(data: T): T & ObservableData<T, K> {
        let container = new ObservableData<T>();
        Object.keys(data).forEach(item => {
            if ((data as any)[item] != null) {
                (container as any)[item] = (data as any)[item];
            }
        });
        let proxy = new Proxy(container, {
            set: function (obj, prop: string, value: any) {
                let oldValue=(obj as any)[prop];
                (obj as any)[prop] = value;
                container.emit("setAtt", { att: prop, newValue: value, oldValue});
                (container as any).emit(prop, { newValue: value, oldValue });
                return true;
            }
        });
        return proxy as any;
    }
}