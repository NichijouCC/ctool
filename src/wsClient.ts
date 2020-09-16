import { EventEmitter } from "./eventEmitter";
import { retryFn } from "./retryFn";

export class WSClient extends EventEmitter {
    static connect(url: string, options?: IwsOpts) {
        return new WSClient(url, options);
    }

    private url: string;
    private options: Required<IwsOpts>;
    private client: { ins: WebSocket; destory: () => void; };
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
            this.client.destory();
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
        this.client = { ins: ws, destory };
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

    reconnect = () => {
        if (this.beOpen) return;
        if (this.beActive != true) this.beActive = true;
        const { autoreconnect: { reconnectCondition, reconnectCount } } = this.options;
        if (reconnectCondition != null) {
            retryFn({ func: () => reconnectCondition(), count: reconnectCount })
                .then((beOk) => {
                    if (beOk) {
                        this._reconnect();
                    } else {
                        this.emit(WSEventEnum.reconnect_fail, "Result of check reconnectcondition is false");
                    }
                })
                .catch((err) => {
                    console.error("failed to check reconnectcondition", err);
                    this.emit(WSEventEnum.reconnect_fail, "failed to check reconnectcondition");
                });
        } else {
            this._reconnect();
        }
    }

    private _reconnect = () => {
        let notifyConnecting = false;
        retryFn<WebSocket>({
            func: () => createWs(this.url),
            count: this.options.autoreconnect.reconnectCount,
            onceCallback: (index) => {
                this.emit(WSEventEnum.reconnecting, index);
                if (!notifyConnecting) {
                    notifyConnecting = true;
                    this.emit(WSEventEnum.connecting, "连接中...");
                }
            }
        })
            .then((ins) => {
                this.attachWs(ins);
                this.emit(WSEventEnum.reconnect, "ws 重连成功");
                this.emit(WSEventEnum.connect, "ws 建立连接[重连]");
            })
            .catch(() => {
                this.emit(WSEventEnum.reconnect_fail, "ws 重连失败");
            });
    }

    private onmessage = (ev: MessageEvent) => {
        this.emit(WSEventEnum.message, ev.data);
    }

    get beOpen() { return this.client?.ins.readyState == 1; };
    close = () => {
        // this.removeAllListeners();
        this.beActive = false;
        this.client?.destory();
        this.client = null;
    }

    sendmsg = (msg: any) => {
        if (this.beOpen) this.client?.ins.send(msg);
    }
}

export interface IwsOpts {
    autoreconnect?: {
        /**
         * 默认开启
         */
        active?: boolean,
        /**
         * 默认5
         */
        reconnectCount?: number,
        reconnectCondition?: () => Promise<boolean>
    }
}

export enum WSEventEnum {
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
        const onClose = (ev: CloseEvent) => {
            reject(ev);
        };
        const onOpen = () => {
            ins.removeEventListener("open", onOpen);
            ins.removeEventListener("close", onClose);
            resolve(ins);
        };
        ins.addEventListener("open", onOpen);
        ins.addEventListener("close", onClose);
    });
}
