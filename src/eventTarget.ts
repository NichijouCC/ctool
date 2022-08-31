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
    protected listener: ((event: T) => void | boolean)[] = [];

    /**
     * 是否激活事件管理器，默认：true
     * 
     * 在激活状态下触发事件才会触发监听器
     */
    beActive = true;

    /**
     * 添加监听器;监听函数返回true则结束监听
     * @param func 
     */
    addEventListener(func: (event: T) => void | boolean) {
        this.listener.push(func);
    }

    /**
     * 移除监听器
     * @param func 
     */
    removeEventListener(func: (event: T) => void | boolean) {
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
            for (let i = 0; i < this.listener.length;) {
                let func = this.listener[i];
                let result = func(event);
                if (result) {
                    this.listener.splice(i, 1);
                } else {
                    i++;
                }
            }
        }
    }

    /**
     * 销毁自己,移除所有监听
     */
    dispose() {
        this.listener = undefined;
    }
}