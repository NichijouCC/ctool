import { describe, it } from "mocha";
import { EventEmitter } from "../src/index";
import { expect } from "chai";

describe("eventEmitter", () => {
    it("listen to event", () => {
        const emiter = new EventEmitter<{ "xx": number }>();
        let result = 0;
        emiter.on("xx", (value) => { result = value; });
        emiter.emit("xx", 100);
        expect(result).to.equal(100);
    });

    it("remove event listener", () => {
        const emiter = new EventEmitter<{ "xx": number }>();
        let result = 0;
        const cb = (value: number) => { result = value; };
        emiter.on("xx", cb);
        emiter.off("xx", cb);
        emiter.emit("xx", 100);
        expect(result).to.equal(0);
    });

    it("remove event listeners", () => {
        const emiter = new EventEmitter<{ "xx": number }>();
        let result = 0;
        emiter.on("xx", (value) => { result = value; });
        emiter.on("xx", (value) => { result = value; });
        emiter.on("xx", (value) => { result = value; });
        emiter.removeEventListeners("xx");
        emiter.emit("xx", 100);
        expect(result).to.equal(0);
    });

    it("remove all event listeners", () => {
        const emiter = new EventEmitter<{ "xx": number, "bb": number }>();
        let result = 0;
        emiter.on("xx", (value) => { result = value; });
        emiter.on("xx", (value) => { result = value; });
        emiter.on("xx", (value) => { result = value; });
        emiter.on("bb", (value) => { result = value; });
        emiter.removeAllListeners();
        emiter.emit("xx", 100);
        emiter.emit("bb", 100);
        expect(result).to.equal(0);
    });

    it("set active state", () => {
        const emiter = new EventEmitter<{ "xx": number }>();
        let result = 0;
        emiter.on("xx", (value) => { result = value; });
        emiter.beActive = false;
        emiter.emit("xx", 100);
        expect(result).to.equal(0);
        emiter.beActive = true;
        emiter.emit("xx", 100);
        expect(result).to.equal(100);
    });
});
