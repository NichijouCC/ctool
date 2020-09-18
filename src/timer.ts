import { EventTarget } from "./eventTarget";

/* eslint-disable no-useless-constructor */
/**
 * 计时器
 * 
 * @example
 * 
 * ```typescript
 * const timer = Timer.create();
 * // update监听
 * timer.tick.addEventListener((deltaTime) => {
 *     console.log("deltaTime:", deltaTime);
 *     // 总计时
 *     const time = timer.recordTime;
 * });
 * 
 * // 重置计时
 * timer.resetRecordTime();
 * 
 * // 释放
 * timer.dispose();
 * ```
 */
export class Timer {
    private _lastTime: number;
    private _recordTime: number = 0;
    private _beactive: boolean = true;
    /**
     * 是否激活计时器,默认：true
     */
    set beactive(state: boolean) {
        if (state == false) {
            this._lastTime = null;
        }
        this._beactive = state;
    }

    get beactive() { return this._beactive; }

    /**
     * 创建计时器实例
     */
    constructor() {
        this.startLoop();
    }

    private startLoop = () => {
        if (this._beactive) {
            const currentTime = Date.now();
            const deltaTime = this._lastTime != null ? (currentTime - this._lastTime) : 0;
            this._lastTime = currentTime;
            this._recordTime += deltaTime;
            this.tick.raiseEvent(deltaTime);
        }
        if (!this._bedisposed) {
            requestAnimationFrame(this.startLoop);
        }
    }

    /**
     * 获取总计时
     */
    get recordTime() { return this._recordTime; }
    /**
     * 重置计时
     */
    resetRecordTime() { this._recordTime = 0; }
    /**
     * update事件
     */
    tick = new EventTarget<number>();

    private _bedisposed = false;
    /**
     * 释放次实例
     */
    dispose() {
        this._bedisposed = true;
        this.tick.dispose();
    }
}
