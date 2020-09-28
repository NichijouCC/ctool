import { describe, it } from "mocha";
import { expect } from "chai";
import { guid } from "../src/guid";

describe("guid", () => {
    it("create 1000 uniqual id", () => {
        const idArr = [...Array(1000)].map(item => guid());
        const uniqueArr = Array.from(new Set(idArr));
        const beequal = idArr.length == uniqueArr.length;
        expect(beequal).to.equal(true);
    });
});
