import { describe, it } from "mocha";
import { expect } from "chai";
import { guid } from "../src/guid";

describe("guid", () => {
    it("should return true", () => {
        const idArr = new Array(1000).map(item => guid()).flat();
        const uniqueArr = Array.from(new Set(idArr));
        const beequal = idArr.length == uniqueArr.length;
        expect(beequal).to.equal(true);
    });
});
