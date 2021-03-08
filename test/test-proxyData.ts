import { describe, it } from "mocha";
import { ProxyData } from "../src/index";
import { expect } from "chai";

describe("proxyData", () => {
    it("set and get", () => {
        let proxy = ProxyData.create({ a: 1, b: 2 });
        expect(proxy.a).to.equal(1);
        expect(proxy.b).to.equal(2);
        proxy.a = 2;
        expect(proxy.a).to.equal(2);
        expect(proxy.b).to.equal(2);
    });
    it("proxy events", (done) => {
        let proxy = ProxyData.create({ a: 1, b: 2 });
        proxy.on("a", (ev => {
            expect(ev.newValue).to.equal(2);
            done();
        }));
        proxy.a = 2;
    });
});
