import { describe, it } from "mocha";
import { PersistPromise } from "../src/index";
import { expect } from "chai";

describe("persistPromise", () => {
    it("check equal", (done) => {
        let a = 0;
        const action = PersistPromise.create((): Promise<number> => {
            return new Promise((resolve, reject) => {
                setTimeout(() => resolve(Math.random()), 100)
            })
        });
        Promise.all([action(), action(), action()]).then((results) => {
            let bequal = results[0] == results[1] && results[1] == results[2];
            expect(bequal).to.equal(true);
            done();
        })
    });
});
