import { describe, it, before } from "mocha";
import * as ws from "ws";
import { expect } from "chai";
import { TinyRpcClient, TinyRpcServer } from "../src";

describe("test-tinyRpcClient", () => {
    before(() => {
        global.WebSocket = ws as any;
    });
    it("call method", (done) => {
        var server = TinyRpcServer.create({ port: 9191 });
        server.registerMethod("add", (data: any[]) => {
            return data[0] + data[1];
        })

        const ins = new TinyRpcClient("ws://localhost:9191", { messageType: "string" });
        ins.on("connect", () => {
            ins.callMethod("add", [1, 2])
                .then(res => {
                    expect(res).to.equal(3);
                    done();
                })
        });
    });
});
