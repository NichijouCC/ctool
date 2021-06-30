import { describe, it } from "mocha";
import { EventEmitter, RecurveObservable, Watch } from "../src/index";
import { expect } from "chai";

describe("RecurveObservable", () => {

    it("observe target first layer", () => {
        let target = { a: 1, b: 2, c: { d: 1 } };
        const observable = RecurveObservable(target);

        let result = 0;
        Watch(observable, "a", (value) => {
            result = value;
        });
        observable.a = 100;
        expect(result).to.equal(100);
    });

    it("observe target second layer", () => {
        let target = { a: 1, b: 2, c: { d: 1 } };
        const observable = RecurveObservable(target);

        let result = 0;
        Watch(observable.c, "d", (value) => {
            result = value;
        });
        observable.c.d = 100;
        expect(result).to.equal(100);
    });

    it("observe target any layer change ,notify parent", () => {
        let target = { a: 1, b: 2, c: { d: 1 } };
        const observable = RecurveObservable(target);
        let result = 0;
        Watch(observable, "c", (value) => {
            result = value.d;
        });
        observable.c.d = 100;
        expect(result).to.equal(100);
    });

});
