import { describe, it, before } from "mocha";
import { TinyWsClient } from "../src/index";
import * as ws from "ws";
import { expect } from "chai";

describe("tinyWsClient", () => {
    const backmsgMark = "server:";
    let wsServer: ws.Server;
    before(() => {
        global.WebSocket = ws as any;
        var server = new ws.Server({ port: 8181 });
        server.on("connection", function (ws) {
            ws.on("message", function (message) {
                ws.send(backmsgMark + message);
            });
        });
        wsServer = server;
    });

    it("create", (done) => {
        const ins = TinyWsClient.connect("ws://localhost:8181");
        ins.on("connect", () => {
            done();
        });
    });

    it("send message", (done) => {
        const ins = TinyWsClient.connect("ws://localhost:8181");
        const msg = "hello";
        ins.on("connect", () => {
            ins.sendMessage(msg);
        });
        ins.on("message", (ev) => {
            expect(ev).to.be.equal(backmsgMark + msg);
            done();
        });
    });

    it("disconnect", (done) => {
        var server = new ws.Server({ port: 8383 });
        const ins = TinyWsClient.connect("ws://localhost:8383", { autoReconnect: { active: false } });
        ins.on("connect", () => {
            server.close();
        });

        ins.on("disconnect", () => {
            done();
        });
    });

    it("reconnect trigger", (done) => {
        var server = new ws.Server({ port: 8484 });
        const ins = TinyWsClient.connect("ws://localhost:8484");
        ins.on("connect", () => {
            server.close();
        });
        ins.on("reconnecting", () => { done(); });
    });

    it("reconnect once trigger", (done) => {
        const ins = TinyWsClient.connect("ws://localhost:8585");
        let tryCount = 0; let failedCount = 0; let sucessedCount = 0;
        ins.on("once_reconnecting", (index) => {
            tryCount++;
        });

        ins.on("once_reconnect_fail", () => {
            failedCount++;
        });

        ins.on("once_reconnect", () => {
            sucessedCount++;
        });

        ins.on("reconnect_fail", () => {
            expect(tryCount).to.be.equal(5);
            expect(failedCount).to.be.equal(5);
            expect(sucessedCount).to.be.equal(0);
            done();
        });
    }).timeout(20000);

    it("reconnect failed", (done) => {
        const ins = TinyWsClient.connect("ws://localhost:8585", { autoReconnect: { reconnectCount: 1 } });
        ins.on("reconnect_fail", () => {
            done();
        });
    }).timeout(20000);

    it("reconnect success", (done) => {
        const ins = TinyWsClient.connect("ws://localhost:8686");
        ins.on("disconnect", () => {
            var server = new ws.Server({ port: 8686 });
        });

        let result = 0;
        ins.on("once_reconnect", () => {
            result = 100;
        });

        ins.on("reconnect", () => {
            expect(result).to.be.equal(100);
            done();
        });
    }).timeout(20000);
});
