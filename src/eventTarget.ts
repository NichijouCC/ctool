/**
 * 单个事件的事件管理器
 * 
 * @description <br/> 
 * <br/> 
 * node.js eventTarget
 * @example
 * ```typescript
 * const clickEvent = new EventTarget();
 * 
 * // ---监听事件
 * clickEvent.addEventListener(() => {
 *     console.log("干点啥！");
 * });
 * 
 * // ---触发事件
 * clickEvent.raiseEvent();
 * ```
 */
export class EventTarget<T = void> {
    protected listener: ((event: T) => void)[] = [];

    /**
     * 是否激活事件管理器，默认：true
     * 
     * 在激活状态下触发事件才会触发监听器
     */
    beActive = true;

    /**
     * 添加监听器
     * @param func 
     */
    addEventListener(func: (event: T) => void) {
        this.listener.push(func);
    }

    /**
     * 移除监听器
     * @param func 
     */
    removeEventListener(func: (event: T) => void) {
        const index = this.listener.indexOf(func);
        if (index >= 0) {
            this.listener.splice(index);
        }
    }

    /**
     * 移除所有监听器
     */
    removeAllListeners() { this.listener = []; }

    /**
     * 触发事件
     * @param event 
     */
    raiseEvent(event: T) {
        if (this.beActive) {
            this.listener.forEach(fuc => {
                fuc(event);
            });
        }
    }

    /**
     * 销毁自己,移除所有监听
     */
    dispose() {
        this.listener = undefined;
    }
}