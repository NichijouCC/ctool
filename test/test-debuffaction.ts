import { describe, it } from "mocha";
import { DebuffAction } from "../src/index";
import { expect } from "chai";

describe("debuffaction", () => {
    it("do action and dispose", () => {
        let a = 0;
        const action = DebuffAction.create(() => {
            a = 100;
            const time = setTimeout(() => { a = 5; }, 1000);
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
