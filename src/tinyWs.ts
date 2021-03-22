import { EventEmitter } from "./eventEmitter";
import { retryPromise } from "./retryPromise";
import { wrapPromise } from "./wrapPromise";

/**
 * websocket封装
 * 
 * @description <br/> 
 * <br/>  
 * feature:
 * 1. 断线重连
 * 
 * @example
 * ```typescript
 * const client = TinyWs.connect("wss://echo.websocket.org");
 * client.on("connect", () => {
 *     console.log("connect to server");
 *     client.sendMessage({ role: 1, message: "hello！" });
 * });
 * client.on("error", (err) => console.log("出错", err));
 * 
 * client.on("reconnecting", () => console.log("开始重连..."));
 * client.on("reconnect", () => console.log("重连成功"));
 * client.on("reconnect_fail", () => console.log("重连失败"));
 * 
 * client.on("once_reconnecting", () => console.log("单次开始重连..."));
 * client.on("once_reconnect", () => console.log("单次重连成功"));
 * client.on("once_reconnect_fail", () => console.log("单次重连失败"));
 * 
 * client.on("message", (data) => console.log("new message", data));
 * 
 * // 使用connectSync
 * (async () => {
 *     const ins = await TinyWs.connectSync("wss://echo.websocket.org");
 *     ins.sendMessage("sssss");
 *     ins.on("message", (data) => {
 *         console.log("new message", data);
 *     });
 * })();
 * ```
 */
export class TinyWsClient extends EventEmitter<WSClientEventMap> {
    /**
     * 创建wsClient,等待连接建立
     * @param url ws服务器地址
     * @param options 
     */
    static connectSync(url: string, options?: IwsOpts): Promise<TinyWsClient> {
        return new Promise((resolve, reject) => {
            const ins = new TinyWsClient(url, options);
            ins.on("connect", () => resolve(ins));
            if (ins.options.autoReconnect.active) {
                ins.on("reconnect_fail", (err) => reject(err));
            } else {
                ins.on("disconnect", (err) => reject(err));
            }
        });
    }

    private _receiveMessage = (msg: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView) => {
        this.emit(WSEventEnum.message, msg);
    }

    private _sendMessage = (data: string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView) => {
        if (this.beOpen) {
            this.client.ins.send(data);
        }
    }

    interceptors = { send: new Interceptor(this._sendMessage), receive: new Interceptor(this._receiveMessage) };
    /**
     * 创建wsClient, 不需要等待连接建立
     * @param url ws服务器地址
     * @param options 
     */
    static connect<T>(this: new (...params: any) => T, url: string, options?: IwsOpts): T {
        return new (this as any)(url, options) as T;
    }

    private url: string;
    private options: Omit<Required<IwsOpts>, "listeners">;
    private client: { ins: WebSocket; close: () => void; };
    constructor(url: string, opts: IwsOpts = {}) {
        super();
        this.url = url;
        const { autoReconnect = {} } = opts;
        this.options = {
            autoReconnect: {
                active: autoReconnect.active ?? true,
                reconnectCount: autoReconnect.reconnectCount ?? 5,
                reconnectCondition: autoReconnect.reconnectCondition
            }
        };
        this.attachWs(new WebSocket(url));
        if (opts.listeners) {
            for (const event in opts.listeners) {
                this.on(event as any, opts.listeners[event]);
            }
        }
        this.emit(WSEventEnum.connecting, undefined);
    }

    private attachWs = (ws: WebSocket) => {
        if (this.client) {
            this.client.close();
        }
        ws.addEventListener("open", this.onopen);
        ws.addEventListener("close", this.onclose);
        ws.addEventListener("message", this.onmessage);
        ws.addEventListener("error", this.onerror);

        const destroy = () => {
            ws.removeEventListener("open", this.onopen);
            ws.removeEventListener("close", this.onclose);
            ws.removeEventListener("message", this.onmessage);
            ws.removeEventListener("error", this.onerror);
            ws.close();
        };
        this.client = { ins: ws, close: destroy };
    }

    private onopen = (ev: Event) => {
        this.emit(WSEventEnum.connect, ev);
    }

    private onclose = (ev: CloseEvent) => {
        this.emit(WSEventEnum.disconnect, ev);
        const { autoReconnect: { active } } = this.options;
        if (active) {
            this.reconnect();
        }
    }

    private onerror = (ev: Event) => {
        this.emit(WSEventEnum.error, ev);
    }

    protected onmessage = (ev: MessageEvent) => {
        this.interceptors.receive.execute(ev.data);
    }

    private reconnect = async () => {
        if (this.beOpen) return;
        const { reconnectCount } = this.options.autoReconnect;
        this.emit(WSEventEnum.reconnecting, undefined);
        retryPromise(() => this._onceConnect(),
            {
                count: reconnectCount,
                onceTryBefore: (index) => {
                    this.emit(WSEventEnum.once_reconnecting, index);
                },
                onceTryCallBack: (index, result, err) => {
                    if (result) {
                        this.emit(WSEventEnum.once_reconnect, undefined);
                    } else {
                        this.emit(WSEventEnum.once_reconnect_fail, undefined);
                    }
                }
            })
            .then((ws) => {
                this.attachWs(ws);
                this.emit(WSEventEnum.reconnect, undefined);
                this.emit(WSEventEnum.connect, undefined);
            })
            .catch(() => {
                this.emit(WSEventEnum.reconnect_fail, undefined);
                this.emit(WSEventEnum.disconnect, undefined);
            });
    }

    private _onceConnect = async () => {
        const { autoReconnect: { reconnectCondition } } = this.options;
        if (reconnectCondition != null) {
            const [err, result] = await wrapPromise(() => reconnectCondition());
            if (err) {
                return Promise.reject(new Error("重连校验的过程报错"));
            } else {
                if (!result) {
                    return Promise.reject(new Error("重连校验结果为false"));
                }
            }
        }
        this.emit(WSEventEnum.connecting, undefined);
        return createWs(this.url);
    }

    /**
     * 是否ready
     */
    get beOpen() { return this.client?.ins.readyState == 1; };
    /**
     * 关闭 websocket
     */
    dispose = () => {
        this.beActive = false;
        this.client?.close();
        this.client = null;
    }


    /**
     * 发送消息。注意：未建立连接,会发送失败
     */
    sendMessage(data: any) {
        this.interceptors.send.execute(data);
    }
}

export class Interceptor<T = any> {
    private _proxy: Function;
    private _before: (...params: any) => T | Promise<T>;
    constructor(proxy: (...params: any) => any) {
        this._proxy = proxy;
    }
    use = (before: (...params: any) => T | Promise<T>) => {
        this._before = before;
    };
    execute(data: any): Promise<T> {
        if (this._before != null) {
            let beforeResult = this._before(data);
            if (beforeResult instanceof Promise) {
                return beforeResult.then((res) => {
                    return this._proxy?.(res);
                })
            } else {
                return Promise.resolve(this._proxy?.(beforeResult));
            }
        } else {
            return Promise.resolve(this._proxy?.(data));
        }
    }
}

/**
 * 创建ws的可配置参数
 */
export interface IwsOpts {
    /**
     * 自动重连可选配置
     */
    autoReconnect?: {
        /**
         * 是否自动重连,默认开启
         */
        active?: boolean,
        /**
         * 重连次数，默认5
         */
        reconnectCount?: number,
        /**
         * 重连前置条件
         */
        reconnectCondition?: () => Promise<boolean>
    }
    /**
     * 事件监听
     */
    listeners?: { [key in keyof WSEventEnum]: () => void };
}

/**
 * ws 事件枚举器
 */
export enum WSEventEnum {
    /**
     * 建立连接中触发
     */
    connecting = "connecting",
    /**
     * 建立连接触发
     */
    connect = "connect",
    /**
     * 连接被关闭时触发
     */
    disconnect = "disconnect",
    /**
     * 发生错误时触发
     */
    error = "error",
    /**
     * 收到数据时触发
     */
    message = "message",
    /**
     * 尝试重连时触发
     */
    reconnecting = "reconnecting",
    /**
     * 重连成功时触发
     */
    reconnect = "reconnect",
    /**
     * 重连失败时触发
     */
    reconnect_fail = "reconnect_fail",
    /**
     * 单次重连时触发
     */
    once_reconnecting = "once_reconnecting",
    /**
     * 单次重连成功时触发
     */
    once_reconnect = "once_reconnect",
    /**
     * 单次重连失败时触发
     */
    once_reconnect_fail = "once_reconnect_fail",

}

function createWs(url: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const ins = new WebSocket(url);
        const onclose = (ev: CloseEvent) => {
            reject(ev);
        };
        const onerror = () => { };
        const onopen = () => {
            ins.removeEventListener("open", onopen);
            ins.removeEventListener("close", onclose);
            ins.removeEventListener("error", onerror);
            resolve(ins);
        };
        ins.addEventListener("open", onopen);
        ins.addEventListener("close", onclose);
        ins.addEventListener("error", onerror);
    });
}

export interface WSClientEventMap {
    "connect": Event;
    "connecting": void;
    "disconnect": CloseEvent;
    "error": Event;
    "message": any;
    "reconnecting": void;
    "reconnect": void;
    "reconnect_fail": void;
    "once_reconnecting": number;
    "once_reconnect": void;
    "once_reconnect_fail": void;
}