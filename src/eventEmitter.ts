/**
 * 
 * 多个事件的集合管理器
 * 
 * @description <br/> 
 * <br/> 
 * node.js EventEmitter的简版
 * 
 * @example
 * ```typescript
 * // --------- EventEmitter基本使用 -----------
 * const emitter = new EventEmitter();
 * 
 * // 听事件-》触发事件-》移除事件
 * const onHover = () => console.log("be hovered!");
 * emitter.on("hover", onHover);
 * emitter.emit("hover");
 * emitter.off("hover", onHover);
 * 
 * // 多个事件监听-》移除
 * emitter.on("hover", onHover);
 * emitter.on("hover", onHover);
 * emitter.removeEventListeners("hover");
 * 
 * // 暂时禁用事件管理器
 * emitter.beActive = false;
 * 
 * // 移除所有事件的监听器
 * emitter.removeAllListeners();
 * 
 * // ----------定义事件类型
 * interface KeyboardEventMap {
 *     "keydown": KeyboardEvent,
 *     "keyup": KeyboardEvent
 * }
 * 
 * const keyboard = new EventEmitter<KeyboardEventMap>();
 * keyboard.on("keydown", (ev) => {
 *     console.log(ev.keyCode);
 * });
 * ```
 */
export class EventEmitter<T = { [key: string]: void }> {
    protected _listener = {} as any;
    /**
     * 激活/禁用 事件管理器，在激活状态下，触发事件才会触发监听器
     */
    beActive = true;
    /**
     * 为指定事件添加一个监听器到监听器数组的尾部
     * @param ev 事件str
     * @param callback 监听函数
     */
    on<K extends keyof T>(ev: K, callback: (ev: T[K]) => void) {
        if (this._listener[ev] == null) this._listener[ev] = [];
        this._listener[ev].push(callback);
    }

    /**
     * 触发指定事件，并传递参数
     * @param ev 事件str
     * @param params 事件传递的可选参数
     */
    emit<K extends keyof T>(ev: K, params?: T[K]) {
        if (this.beActive) {
            this._listener[ev]?.forEach((func: (...args: any) => any) => func(params));
        }
    }

    /**
     * 取消对指定事件的监听
     * @param ev 事件str
     * @param callback 监听函数
     */
    off<K extends keyof T>(ev: K, callback: (ev: T[K]) => void) {
        if (this._listener[ev]) {
            const index = this._listener[ev].indexOf(callback);
            if (index >= 0) {
                this._listener[ev].splice(index, 1);
            }
        }
    }

    /**
     * 移除指定事件的所有监听器
     * @param ev 事件
     */
    removeEventListeners<K extends keyof T>(ev: K) {
        this._listener[ev] = [];
    }

    /**
     * 移除所有事件的监听器
     */
    removeAllListeners() {
        this._listener = {};
    }
}
