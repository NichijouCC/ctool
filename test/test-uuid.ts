import { describe, it } from "mocha";
import { expect } from "chai";
import { UUID } from "../src";

describe("uuid", () => {
    it("create 1000 unique id", () => {
        const idArr = [...Array(1000)].map(item => UUID.create_v4());
        const uniqueArr = Array.from(new Set(idArr));
        const beEqual = idArr.length == uniqueArr.length;
        expect(beEqual).to.equal(true);
    });
});
