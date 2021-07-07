import { UUID } from "./uuid";
import { IwsOpts, TinyWsClient } from "./tinyWs";
import { EventEmitter } from "./eventEmitter";

/**
 * @example 
 * ```
 * //创建 client
 * let ins: RpcClient =new RpcClient("ws://localhost:3030") as any;
 * ins.on("connect", () => {
 *      //调用远程方法
 *     ins.callMethod("add", [1, 2])
 *         .then(result => {
 *             console.log("result equal 3", result);
 *         })
 * })
 * ```
 * 
 */
export class RpcClient extends TinyWsClient {
    protected opts: IRpcClientOptions;
    constructor(url: string, opts: IRpcClientOptions = {}) {
        super(url, opts);
        this.opts = opts;
        this.opts.timeOut = opts.timeOut ?? 3000;
        this.opts.messageType = opts.messageType ?? "buffer";
        this.on("message", (data: any) => {
            let { id } = data;
            if (id != null) {
                let cb = this.rpcCall.get(id);
                if (cb) {
                    cb.resolve(data.result);
                    this.rpcCall.delete(id);
                }
            }
        });

        switch (this.opts.messageType) {
            case "string":
                this.interceptors.send.use((data: object) => {
                    return JSON.stringify(data);
                });
                this.interceptors.receive.use((data: string) => {
                    return JSON.parse(data);
                });
                break;
            case "buffer":
            default:
                this.interceptors.send.use((data: object) => {
                    return Buffer.from(JSON.stringify(data));
                });
                this.interceptors.receive.use((data: Buffer) => {
                    return JSON.parse(data.toString());
                });
                break;
        }
    }

    private handleTimeout = (id: string) => {
        let cb = this.rpcCall.get(id);
        if (cb) {
            cb.reject(new Error("time out"));
            this.rpcCall.delete(id);
        }
    }
    private rpcCall = new Map<string, { resolve: (result: any) => void, reject: (err: Error) => void }>();
    /**
     * rpc调用
     * @param methodName 
     * @param params 
     */
    callMethod<T = any>(methodName: string, params: any[]): Promise<T> {
        return new Promise((resolve, reject) => {
            if (this.beOpen) {
                let msgId = UUID.create_v4();
                this.sendMessage({ id: msgId, method: methodName, params });
                this.rpcCall.set(msgId, { resolve, reject });
                setTimeout(() => this.handleTimeout(msgId), this.opts.timeOut)
            }
        })
    }
}

export interface IRpcClientOptions extends IwsOpts {
    /**
     * 默认值：3000
     */
    timeOut?: number;
    /**
     * 默认值：`buffer`
     */
    messageType?: "buffer" | "string";
}

/**
 * @example 
 * ```
 * //创建server
 * RpcServer.create({ port: 8080 });
 * ```
 * @example 
 * ```
 * //使用 http/https server
 * const fs = require('fs');
 * const https = require('https');
 * const WebSocket = require('ws');
 *
 * const server = https.createServer({
 * cert: fs.readFileSync('/path/to/cert.pem'),
 * key: fs.readFileSync('/path/to/key.pem')
 * });
 * 
 * RpcServer.create({server});
 * ```
 * @param options 
 */
export class RpcServer extends EventEmitter {

    static create(options: { port?: number, server?: any }) {
        return new RpcServer(options);
    }
    private constructor(options: { port?: number, server?: any }) {
        super();
        const WebSocket = require('ws');
        if (WebSocket == null) throw new Error(`"ws" module must be install before use TinyWsServer`);
        const wss = new WebSocket.Server(options);
        wss.on("close", () => this.emit("close"));
        wss.on("error", (err: any) => this.emit("error", err));
        wss.on("connection", (ws: any) => {
            ws.on("message", (data: any) => this._handleMessage(ws, data));
        })
    }

    private _handleMessage = (ws: any, data: any) => {
        if (typeof data == "string") {
            let realData = JSON.parse(data);
            let { id, method, params } = realData;
            let handler = this._handlers.get(method);
            if (handler != null) {
                let result = handler(params);
                ws.send(JSON.stringify({ id, result }));
            }

        } else if (Buffer.isBuffer(data)) {
            let realData = JSON.parse(data.toString());
            let { id, method, params } = realData;
            let handler = this._handlers.get(method);
            if (handler != null) {
                let result = handler(params);
                ws.send(Buffer.from(JSON.stringify({ id, result })));
            }
        }
    }

    private _handlers = new Map<string, (params: any[]) => any>();
    registerMethod = (method: string, handler: (params: any[]) => any) => {
        this._handlers.set(method, handler);
    }

    unregisterMethod = (method: string) => {
        this._handlers.delete(method);
    }
}
/**
 * 基于tinyWs的简易rpc实现
 *
 *@description <br/>
 * <br/>
 *
 * 发送消息结构:
 * ```
 * {
 *      id: "消息id",
 *      method: "消息名",
 *      params: "消息参数"
 * }
 * ```
 * 返回消息结构:
 * ```
 * {
 *      id:"消息id",
 *      result:"方法结果"
 * }
 * ```
 *
 * @example
 *
 * ```
 * //创建server
 * var server = TinyRpcServer.create({ port: 9191 });
 * server.registerMethod("add", (data: any[]) => {
 *     return data[0] + data[1];
 * })
 * ```
 *
 * @example
 * ```
 * //创建 client
 * let ins: TinyRpcClient =new TinyRpcClient("ws://localhost:3030") as any;
 * ins.on("connect", () => {
 *      //调用远程方法
 *     ins.callMethod("add", [1, 2])
 *         .then(result => {
 *             console.log("result equal 3", result);
 *         })
 * })
 * ```
 *
 *
 */