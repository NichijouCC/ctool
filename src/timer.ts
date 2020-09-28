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

    private _interval: number;
    /**
     * 计时间隔, 默认：undefined
     */
    set interval(value: number) {
        this._interval = value;
    }

    get interval() { return this._interval; }

    /**
     * 创建计时器实例
     */
    constructor() {
        this._loopFunc = requestAnimationFrame ?? ((func: () => void) => { setTimeout(func, 0); });
        this.startLoop();
    }

    private _loopFunc: (func: () => void) => void;

    private _tickDeltaTime: number = 0;
    private _tickOffsetTime: number = 0;

    private startLoop = () => {
        if (this._beactive) {
            const currentTime = Date.now();
            const deltaTime = this._lastTime != null ? (currentTime - this._lastTime) : 0;
            this._lastTime = currentTime;
            this._recordTime += deltaTime;

            if (this._interval != null) {
                this._tickDeltaTime += deltaTime;
                const newOffset = this._tickDeltaTime + this._tickOffsetTime - this._interval;
                if (newOffset >= 0) {
                    this._tickOffsetTime = newOffset;
                    this.tick.raiseEvent(this._tickDeltaTime);
                    this._tickDeltaTime = 0;
                }
            } else {
                this.tick.raiseEvent(deltaTime);
            }
        }
        if (!this._bedisposed) {
            this._loopFunc(this.startLoop);
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
