import { EventEmitter } from "./eventEmitter";
import { retryFn } from "./retryFn";
import { WrapPromise } from "./wrapPromise";

/**
 * websocket封装
 * 
 * @description
 * feature:
 * 1. 断线重连
 * 
 * @example
 * ```typescript
 * const client = TinyWs.connect("wss://echo.websocket.org");
 * client.on("connect", () => {
 *     console.log("connect to server");
 * });
 * client.on("message", (data) => {
 *     console.log("new message", data);
 * });
 * 
 * client.sendmsg({ role: 1, message: "hello！" });
 * ```
 */
export class TinyWs extends EventEmitter<WSClientEventMap> {
    /**
     * 创建wsclient 
     * @param url ws服务器地址
     * @param options 
     */
    static connect(url: string, options?: IwsOpts) {
        return new TinyWs(url, options);
    }

    private url: string;
    private options: Required<IwsOpts>;
    private client: { ins: WebSocket; close: () => void; };
    private constructor(url: string, opts: IwsOpts = {}) {
        super();
        this.url = url;
        const { autoreconnect = {} } = opts;
        this.options = {
            autoreconnect: {
                active: autoreconnect.active ?? true,
                reconnectCount: autoreconnect.reconnectCount ?? 5,
                reconnectCondition: autoreconnect.reconnectCondition
            }
        };
        this.attachWs(new WebSocket(url));
        this.emit(WSEventEnum.connecting, "ws 连接中..");
    }

    private attachWs = (ws: WebSocket) => {
        if (this.client) {
            this.client.close();
        }
        ws.addEventListener("open", this.onopen);
        ws.addEventListener("close", this.onclose);
        ws.addEventListener("message", this.onmessage);
        ws.addEventListener("error", this.onerror);

        const destory = () => {
            ws.removeEventListener("open", this.onopen);
            ws.removeEventListener("close", this.onclose);
            ws.removeEventListener("message", this.onmessage);
            ws.removeEventListener("error", this.onerror);
            ws.close();
        };
        this.client = { ins: ws, close: destory };
    }

    private onopen = (ev: Event) => {
        this.emit(WSEventEnum.connect, ev);
    }

    private onclose = (ev: CloseEvent) => {
        this.emit(WSEventEnum.disconnect, ev);
        const { autoreconnect: { active } } = this.options;
        if (active) {
            this.reconnect();
        }
    }

    private onerror = (ev: Event) => {
        this.emit(WSEventEnum.error, ev);
    }

    private onmessage = (ev: MessageEvent) => {
        this.emit(WSEventEnum.message, ev.data);
    }

    private reconnect = async () => {
        if (this.beopen) return;
        const { reconnectCount } = this.options.autoreconnect;
        retryFn(() => this._onceConnect(),
            {
                count: reconnectCount,
                onceCallback: (index) => {
                    this.emit(WSEventEnum.reconnecting, index);
                }
            });
    }

    private _onceConnect = async () => {
        const { autoreconnect: { reconnectCondition } } = this.options;
        if (reconnectCondition != null) {
            const [err, result] = await WrapPromise(() => reconnectCondition());
            if (err) {
                this.emit(WSEventEnum.reconnect_fail, "failed to check reconnectcondition");
                return false;
            } else {
                if (!result) {
                    this.emit(WSEventEnum.reconnect_fail, "Result of check reconnectcondition is false");
                    return false;
                }
            }
        }
        this.emit(WSEventEnum.connecting, "连接中...");
        const besuccess = await createWs(this.url)
            .then((ins) => {
                this.attachWs(ins);
                this.emit(WSEventEnum.reconnect, "ws 重连成功");
                this.emit(WSEventEnum.connect, new Event("ws 建立连接[重连]"));
                return true;
            })
            .catch(() => {
                this.emit(WSEventEnum.reconnect_fail, "ws 重连失败");

                return false;
            });
        return besuccess;
    }

    /**
     * 是否ready
     */
    get beopen() { return this.client?.ins.readyState == 1; };
    /**
     * 关闭 websocket
     */
    dispose = () => {
        this.beactive = false;
        this.client?.close();
        this.client = null;
    }

    /**
     * 发送消息
     */
    sendmsg = (msg: any) => {
        if (this.beopen) this.client?.ins.send(msg);
    }
}

/**
 * 创建ws的可配置参数
 */
export interface IwsOpts {
    /**
     * 自动重连可选配置
     */
    autoreconnect?: {
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
}

function createWs(url: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const ins = new WebSocket(url);
        const onclose = (ev: CloseEvent) => {
            reject(ev);
        };
        const onopen = () => {
            ins.removeEventListener("open", onopen);
            ins.removeEventListener("close", onclose);
            resolve(ins);
        };
        ins.addEventListener("open", onopen);
        ins.addEventListener("close", onclose);
    });
}

interface WSClientEventMap {
    "connect": Event;
    "connecting": string;
    "disconnect": CloseEvent;
    "error": Event;
    "message": any;
    "reconnecting": number;
    "reconnect": string;
    "reconnect_fail": string;
}
