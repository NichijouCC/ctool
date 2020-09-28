/* eslint-disable prefer-promise-reject-errors */
import { describe, it } from "mocha";
import { tasksSplite } from "../src/index";
import { expect } from "chai";

describe("tasksSplite", () => {
    it("on progress", async () => {
        const tasks = [...Array(100)].map(item => {
            return () => new Promise((resolve, reject) => {
                setTimeout(() => resolve(), 10);
            });
        });
        let count = 0;
        await tasksSplite(tasks, {
            onprogress: (progress, result) => {
                count++;
            }
        });
        expect(count).to.be.equal(tasks.length);
    }).timeout(20000);

    it("tasks error", (done) => {
        const tasks = [...Array(100)].map(item => {
            return () => new Promise((resolve, reject) => {
                setTimeout(() => resolve(), 10);
            });
        });
        tasks.splice(50, 0, () => Promise.reject());
        tasksSplite(tasks).catch(() => done());
    }).timeout(20000);

    it("tasks success", (done) => {
        const tasks = [...Array(100)].map(item => {
            return () => new Promise((resolve, reject) => {
                setTimeout(() => resolve(1), 10);
            });
        });

        tasksSplite(tasks).then((results) => {
            expect(results[1]).to.be.equal(1);
            expect(results.length).to.be.equal(100);
            done();
        });
    });
});
