import { describe, it } from "mocha";
import { expect } from "chai";
import { UUID } from "../src";

describe("uuid", () => {
    it("create 1000 uniqual id", () => {
        const idArr = [...Array(1000)].map(item => UUID.create_v4());
        const uniqueArr = Array.from(new Set(idArr));
        const beequal = idArr.length == uniqueArr.length;
        expect(beequal).to.equal(true);
    });
});
