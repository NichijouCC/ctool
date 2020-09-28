import { describe, it } from "mocha";
import { EventTarget } from "../src/eventTarget";
import { expect } from "chai";

describe("eventtarget", () => {
    it("listen to event", () => {
        const ev = new EventTarget<number>();
        let result = 0;
        ev.addEventListener((value) => {
            result = value;
        });
        ev.raiseEvent(100);
        expect(result).to.equal(100);
    });

    it("remove event listener", () => {
        const ev = new EventTarget();
        let result = 0;
        const listener = () => {
            result = 100;
        };
        ev.addEventListener(listener);
        ev.removeEventListener(listener);
        ev.raiseEvent();
        expect(result).to.equal(0);
    });

    it("remove all listeners", () => {
        const ev = new EventTarget();
        let result = 0;
        ev.addEventListener(() => { result = 1; });
        ev.addEventListener(() => { result = 1; });
        ev.addEventListener(() => { result = 1; });
        ev.addEventListener(() => { result = 1; });
        ev.removeAllListeners();
        ev.raiseEvent();
        expect(result).to.equal(0);
    });
});
