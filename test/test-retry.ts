import { describe, it } from "mocha";
import { retryFn } from "../src/index";
import { expect } from "chai";

describe("retryfn", () => {
    it("once try before", async () => {
        let count = 0;
        await retryFn(() => {
            return new Promise((resolve, reject) => {
                count++;
                if (count > 3) {
                    resolve(count);
                } else {
                    reject(count);
                }
            });
        }, {
            retryFence: 10,
            onceTryBefore: (index) => {
                expect(count).to.equal(index - 1);
            }
        });
    });

    it("once try callback", async () => {
        let count = 0;
        await retryFn(() => {
            return new Promise((resolve, reject) => {
                count++;
                if (count > 3) {
                    resolve(count);
                } else {
                    reject(count);
                }
            });
        }, {
            retryFence: 10,
            onceTryCallBack: (index: number, result: any, err: any) => {
                expect(count).to.equal(index);
                if (result) {
                    expect(result).to.equal(count);
                } else {
                    expect(err).to.equal(count);
                }
            }
        });
    });

    it("retry count", async () => {
        let count = 0;
        await retryFn(() => {
            return new Promise((resolve, reject) => {
                count++;
                if (count > Number.MAX_SAFE_INTEGER) {
                    resolve(count);
                } else {
                    reject(count);
                }
            });
        }, {
            count: 10,
            retryFence: 0
        }).catch((err) => {
            expect(err).to.equal(10);
        });
        expect(count).to.equal(10);
    });

    it("retry error", async () => {
        let count = 0;
        await retryFn(() => {
            return new Promise((resolve, reject) => {
                count++;
                if (count > Number.MAX_SAFE_INTEGER) {
                    resolve(count);
                } else {
                    reject(count);
                }
            });
        }, {
            retryFence: 0
        }).catch((err) => {
            expect(err).to.equal(5);
        });
    });

    it("retry success", async () => {
        let count = 0;
        const result = await retryFn(() => {
            return new Promise((resolve, reject) => {
                count++;
                if (count > 2) {
                    resolve(100);
                } else {
                    reject(count);
                }
            });
        }, {
            retryFence: 0
        });
        expect(result).to.equal(100);
    });
});
