/* eslint-disable prefer-promise-reject-errors */
import { describe, it } from "mocha";
import { wrapPromise } from "../src/index";
import { expect } from "chai";

describe("wrapPromise", () => {
    it("success promise", async () => {
        const [err, result] = await wrapPromise(() => Promise.resolve(100));
        expect(err).to.be.equal(null);
        expect(result).to.be.equal(100);
    });

    it("failed promise", async () => {
        const [err, result] = await wrapPromise(() => Promise.reject<number>(100));
        expect(err).to.be.equal(100);
        expect(result).to.be.equal(null);
    });
});
