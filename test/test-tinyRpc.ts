import { describe, it, before } from "mocha";
import * as ws from "ws";
import { expect } from "chai";
import { TinyRpc } from "../src";

describe("test-tinyRpcClient", () => {
    before(() => {
        global.WebSocket = ws as any;
    });
    it("call method", (done) => {
        var server = TinyRpc.Server.create({ port: 9191 });
        server.registerMethod("add", (data: any[]) => {
            return data[0] + data[1];
        })

        const ins = new TinyRpc.Client("ws://localhost:9191", { messageType: "string" });
        ins.on("connect", () => {
            ins.callMethod("add", [1, 2])
                .then(res => {
                    expect(res).to.equal(3);
                    done();
                })
        });
    });

    it("call batched method", (done) => {
        var server = TinyRpc.Server.create({ port: 9192 });
        server.registerMethod("add", (data: any[]) => {
            return data[0] + data[1];
        })

        server.registerMethod("subtract", (data: { first: number, seconde: number }) => {
            return data.first - data.seconde;
        }, (parmas) => parmas != null ? null : "参数不对")
        const ins = new TinyRpc.Client("ws://localhost:9192", { messageType: "string" });
        ins.on("connect", () => {
            ins.callBatchedMethod([
                {
                    method: "add", params: [1, 2], callback: (result, error) => {
                        expect(result).to.equal(3);
                        expect(error).to.equal(null);
                    }
                },
                {
                    method: "subtract", params: { first: 5, seconde: 1 }, callback: (result, error) => {
                        expect(result).to.equal(4);
                        expect(error).to.equal(null);
                    }
                },
                {
                    method: "xxx", params: { first: 5, seconde: 1 }, callback: (result, error) => {
                        expect(result).to.equal(null);
                        expect(error.code).to.equal(-32601);
                    }
                },
            ])
                .finally(() => done())
        });
    });
});
