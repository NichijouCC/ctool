import { TinyWs } from "./tinyWs";
/**
 * rpc调用
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
 */
export class TinyRpc_ws extends TinyWs {

    protected onmessage = (ev: MessageEvent) => {
        super.onmessage(ev);
        let data: Buffer = ev.data;
        let dataInfo = JSON.parse(data.toString());
        let { } = dataInfo;
        if (dataInfo.rpc != null) {
            let func = this.rpcCall.get(dataInfo.rpc);
            func(dataInfo.result);
            this.rpcCall.delete(dataInfo.rpc);
        }
    }

    private rpcCall = new Map<number, (result: any) => void>();
    /**
     * rpc调用
     * @param methode 
     * @param params 
     */
    callMethod<T = any>(methodeName: string, params: []): Promise<T> {
        return new Promise((resolve, reject) => {
            if (this.beopen) {
                let msgId = performance.now();
                this.rpcCall.set(msgId, resolve);
                this.sendMessage(JSON.stringify({ id: msgId, method: methodeName, params }));
            }
        })
    }
}