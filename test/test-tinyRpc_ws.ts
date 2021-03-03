import { describe, it, before } from "mocha";
import * as ws from "ws";
import { expect } from "chai";
import { TinyRpc_ws } from "../src";

describe("tinyRpc-ws", () => {
    before(() => {
        global.WebSocket = ws as any;
    });
    it("call method", (done) => {
        var server = new ws.Server({ port: 9191 });
        server.on("connection", (socket) => {
            socket.on("message", (data) => {
                let dataInfo = JSON.parse(data.toString())
                socket.send(Buffer.from(JSON.stringify({ id: dataInfo.id, result: 3 })));
            })
        })

        const ins: TinyRpc_ws = TinyRpc_ws.connect("ws://localhost:9191") as any;
        ins.on("connect", () => {
            ins.callMethod("add", [1, 2])
                .then(res => {
                    expect(res).to.equal(3);
                    done();
                })
        });
    });
});
