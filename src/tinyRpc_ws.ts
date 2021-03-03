import { UUID } from "./uuid";
import { IwsOpts, TinyWs } from "./tinyWs";
/**
 * 基于tinyWs的简易rpc实现
 * 
 * @example
 * ```
 * let ins: TinyRpc_ws = TinyRpc_ws.connect("ws://localhost:3030") as any;
 * ins.on("connect", () => {
 *      //调用远程方法
 *     ins.callMethod("add", [1, 2])
 *         .then(result => {
 *             console.log("result equal 3", result);
 *         })
 * })
 * ```
 * 
 * @description <br/> 
 * <br/> 
 * 消息体为buffer格式;
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
 */
export class TinyRpc_ws extends TinyWs {
    constructor(url: string, opts: IwsOpts = {}) {
        super(url, opts);
        this.on("message", (data) => {
            let dataInfo = JSON.parse(data.toString());
            let { id } = dataInfo;
            if (id != null) {
                let func = this.rpcCall.get(id);
                func(dataInfo.result);
                this.rpcCall.delete(id);
            }
        })
    }
    private rpcCall = new Map<string, (result: any) => void>();
    /**
     * rpc调用
     * @param methodName 
     * @param params 
     */
    callMethod<T = any>(methodName: string, params: any[]): Promise<T> {
        return new Promise((resolve, reject) => {
            if (this.beOpen) {
                let msgId = UUID.create_v4();
                this.rpcCall.set(msgId, resolve);
                this.sendMessage(Buffer.from(JSON.stringify({ id: msgId, method: methodName, params })));
            }
        })
    }
}

