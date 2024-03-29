import { EventTarget } from "./eventTarget";

/* eslint-disable no-useless-constructor */
/**
 * 计时器
 * 
 * @example
 * 
 * ```typescript
 * const timer =new Timer();
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
    private _beActive: boolean = true;
    /**
     * 是否激活计时器,默认：true
     */
    set beActive(state: boolean) {
        if (state == false) {
            this._lastTime = null;
        }
        this._beActive = state;
    }
    get beActive() { return this._beActive; }

    private _interval: number;
    /**
     * 计时间隔, 默认：undefined
     */
    set interval(value: number) { this._interval = value; }
    get interval() { return this._interval; }

    /**
     * 创建计时器实例
     */
    constructor(opts?: {
        interval?: number,
        beActive?: boolean
    }) {
        this._interval = opts?.interval;
        this._beActive = opts?.beActive ?? true;
        this.Loop();
    }

    private _tickOffsetTime: number = 0;

    private Loop = () => {
        if (this._beActive) {
            const currentTime = Date.now();
            const deltaTime = this._lastTime != null ? (currentTime - this._lastTime) : 0;
            this._lastTime = currentTime;
            this._recordTime += deltaTime;

            if (this._interval != null) {
                const newOffset = deltaTime + this._tickOffsetTime - this._interval;
                if (newOffset >= 0) {
                    this._tickOffsetTime = newOffset;
                    this.tick.raiseEvent(deltaTime);
                }
            } else {
                this.tick.raiseEvent(deltaTime);
            }
        }
        if (!this._beDisposed) {
            if (typeof requestAnimationFrame != undefined) {
                requestAnimationFrame(this.Loop);
            } else {
                setTimeout(this.Loop, 0);
            }
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

    private _beDisposed = false;
    /**
     * 销毁
     */
    dispose() {
        this._beDisposed = true;
        this.tick.dispose();
    }
}
