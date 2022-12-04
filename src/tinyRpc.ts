import { UUID } from "./uuid";
import { IwsOpts, TinyWsClient } from "./tinyWs";
import { EventEmitter } from "./eventEmitter";
import { OncePromise } from "./exposedPromise";

/**
 * 基于JSON-RPC2.0实现的客户端
 * 
 *@description <br/> 
 * <br/> 
 * 
 * 发送消息结构:
 * ```
 * {
 *      jsonrpc:"2.0",
 *      id: "消息id",
 *      method: "消息名",
 *      params: "消息参数"
 * }
 * ```
 * 返回消息结构:
 * ```
 * {
 *      jsonrpc:"2.0",
 *      id:"消息id",
 *      result:"方法结果",
 *      error:{code:123,message:"出错原因"}
 * }
 * ```
 * @example 创建 client
 * ```
 * let ins =new TinyRpc.Client("ws://localhost:3030") as any;
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
export class Client extends TinyWsClient {
    protected opts: IClientOptions;
    constructor(url: string, opts: IClientOptions = {}) {
        super(url, opts);
        this.opts = opts;
        this.opts.timeOut = opts.timeOut ?? 3000;
        this.opts.messageType = opts.messageType ?? "buffer";
        this.on("message", (data: any) => {
            if (data instanceof Array) {
                data.forEach(item => this.handleResponse(item))
            } else {
                this.handleResponse(data);
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

    private handleResponse(response: IRpcResponse) {
        let { id, result, error } = response;
        if (id != null) {
            let cb = this.rpcCall.get(id);
            if (cb) {
                this.rpcCall.delete(id);
                if (error != null) {
                    cb.reject(error)
                } else {
                    cb.resolve(result);
                }
            }
        } else {
            //找不到response，console打印错误
            if (error != null) {
                console.error("RPC请求报错", error);
            }
        }
    }

    private handleTimeout = (id: string) => {
        let cb = this.rpcCall.get(id);
        if (cb) {
            cb.reject({ code: -1, message: "请求超时" });
            this.rpcCall.delete(id);
        }
    }
    private rpcCall = new Map<string | number, { resolve: (result: any) => void, reject: (error: { code: number, message: string }) => void }>();
    /**
     * rpc调用
     * @param methodName 
     * @param params 
     */
    callMethod<T = any>(method: string, params: any, beNotify = false): Promise<T> {
        if (!this.beOpen) return Promise.reject("websocket还未连接.")
        return new Promise((resolve, reject) => {
            let call: any = { id: null, method, params, jsonrpc: "2.0" }
            if (!beNotify) {
                let callId = UUID.create_v4();
                this.rpcCall.set(callId, { resolve, reject });
                setTimeout(() => this.handleTimeout(callId), this.opts.timeOut);
                call.id = callId;
            }
            this.sendMessage(call);
        })
    }
    /**
     * rpc批量调用
     * @param requests 
     */
    callBatchedMethod(requests: { method: string, params: any, beNotify?: boolean, callback?: (result: any, error: { code: number, message: string }) => void }[]) {
        if (!this.beOpen) return Promise.reject({ "message": "websocket还未连接." });
        let task = OncePromise.create();
        let count = 0;
        let content = requests.map((item, index) => {
            let call: any = { id: null, jsonrpc: "2.0", method: item.method, params: item.params }
            if (!item.beNotify) {
                let callId = UUID.create_v4();
                call.id = callId;
                count++;
                this.rpcCall.set(callId,
                    {
                        resolve: (result) => {
                            item.callback?.(result, null);
                            count--;
                            if (count == 0) {
                                task.resolve();
                            }
                        },
                        reject: (error) => {
                            item.callback?.(null, error);
                            task.reject({ callIndex: index, error, message: "请求出错" });
                        }
                    });
                setTimeout(() => this.handleTimeout(callId), this.opts.timeOut);
            }
            return call;
        });
        this.sendMessage(content);
        return task.ins;
    }
}

interface IRpcResponse {
    jsonrpc: "2.0",
    id: string | number,
    result?: any,
    error?: { code: number, message: string }
}

export interface IClientOptions extends IwsOpts {
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
 * @example 创建server,按照JSON-RPC 2.0 规范（https://www.jsonrpc.org/specification）
 * ```
 * TinyRpc.Server.create({ port: 8080 });
 * ```
 * @example 使用 http/https server
 * ```
 * const fs = require('fs');
 * const https = require('https');
 * const WebSocket = require('ws');
 *
 * const server = https.createServer({
 * cert: fs.readFileSync('/path/to/cert.pem'),
 * key: fs.readFileSync('/path/to/key.pem')
 * });
 * 
 * TinyRpc.Server.create({server});
 * ```
 * @param options 
 */
export class Server extends EventEmitter {
    static create(options: { port?: number, server?: any }) {
        return new Server(options);
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
        });
    }

    private _handleMessage = (ws: any, data: any) => {
        let beString = typeof data == "string";
        let realData: any;
        try {
            realData = JSON.parse(beString ? data : data.toString());
        }
        catch (err) {
            ws.send(JSON.stringify({ error: { code: -32700, message: "Parse error语法解析错误" }, jsonrpc: "2.0" }));
            return;
        }
        let result: any;
        if (realData instanceof Array) {
            if (realData.length == 0) {
                ws.send(JSON.stringify({ error: { code: -32600, message: "Invalid Request" }, jsonrpc: "2.0" }));
                return
            }
            result = realData.map(item => this.handlerJsonRpcRequest(item)).filter(item => item != null);

        } else {
            result = this.handlerJsonRpcRequest(realData);
        }
        ws.send(beString ? JSON.stringify(result) : Buffer.from(JSON.stringify(result)))
    }

    private handlerJsonRpcRequest(request: any): object | null {
        let { id, method, params, jsonrpc } = request;
        //JSON-RPC2.0规范request的固定字段
        if (jsonrpc != "2.0" || method == null) {
            return { id, error: { code: -32600, message: "Invalid Request - 无效请求" }, jsonrpc: "2.0" };
        }
        let handler = this._handlers.get(method);
        if (handler == null) {
            return { id, error: { code: -32601, message: "Method not found - 找不到方法" }, jsonrpc: "2.0" };
        }
        if (handler != null) {
            try {
                let error = handler.checkParams?.(params);
                if (error) {
                    return { id, error: { code: -32602, message: "Invalid params - 无效的参数", data: error }, jsonrpc: "2.0" };
                }
                let result = handler.handle(params);
                //JSON-RPC2.0规范request,如果不存在id则为通知，不需要回复
                if (id != null) {
                    return { id, result, jsonrpc: "2.0" };
                }
            }
            catch (error) {
                return { error: { id, code: -32603, message: "Internal error - 内部错误" }, jsonrpc: "2.0" };
            }
        }
        return null;
    }


    private _handlers = new Map<string, { handle: (params: any) => any, checkParams: (params: any) => string }>();
    registerMethod = (method: string, handle: (params: any) => any, checkParams?: (params: any) => string | null) => {
        this._handlers.set(method, { handle, checkParams });
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
 *      result:"方法结果",
 *      error:{code:123,message:"出错原因",data:"出错详情"}
 * }
 * ```
 * 
 * @example 创建server
 * 
 * ```
 * var server = TinyRpcServer.create({ port: 9191 });
 * server.registerMethod("add", (data: any[]) => {
 *     return data[0] + data[1];
 * })
 * ```
 * 
 * @example 创建 client
 * ```
 * let ins: TinyRpcClient =new TinyRpcClient("ws://localhost:3030") as any;
 * ins.on("connect", () => {
 *      //调用远程方法
 *     ins.callMethod("add", [1, 2])
 *         .then(result => {
 *             console.log("result equal 3", result);
 *         })
 * })
 * ```
 */