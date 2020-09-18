import { describe, it } from "mocha";
import { DebuffAction } from "../src/index";
import { expect } from "chai";

describe("debuffaction", () => {
    it("do action", () => {
        let a = 0;
        const action = DebuffAction.excute(() => {
            a = 100;
            const time = setTimeout(() => { a = 0; }, 1000);
            return () => {
                clearTimeout(time);
                a = 0;
            };
        });
        expect(a).to.equal(100);
        action.dispose();
        expect(a).to.equal(0);
    });
});
