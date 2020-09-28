/* eslint-disable no-undef */
import { describe, it, beforeEach, before, after } from "mocha";
import { Timer } from "../src/timer";
import { expect } from "chai";

before(function () {
    (global as any).requestAnimationFrame = (cb: any) => {
        setTimeout(cb, 0);
    };
});

describe("timer", () => {
    it("beactive default to be true", () => {
        const timer = new Timer();
        expect(timer.beactive).to.equal(true);
    });

    it("recordTime", async () => {
        const timer = new Timer();
        await new Promise((resolve, reject) => {
            setTimeout(() => resolve(), 500);
        });
        expect(timer.recordTime).to.approximately(500, 10);
        timer.resetRecordTime();
        expect(timer.recordTime).to.equal(0);
    });

    it("tick update", async () => {
        const timer = new Timer();
        let total = 0;
        timer.tick.addEventListener((deltaTime) => {
            total += deltaTime;
        });
        await new Promise((resolve, reject) => {
            setTimeout(() => resolve(), 50);
        });
        expect(timer.recordTime).to.approximately(total, 10);
    });

    it("intervel", (done) => {
        const timer = new Timer();
        timer.interval = 500;
        let index = 0;
        timer.tick.addEventListener((deltaTime) => {
            index++;
            expect(deltaTime).to.approximately(500, 10);
            if (index == 3) done();
        });
    });
});
