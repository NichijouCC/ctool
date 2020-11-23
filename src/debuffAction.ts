/**
 * 副作用方法管理
 * 
 * @description <br/> 
 * <br/> 
 * 参考：react的useeffect
 * 
 * @example
 * ```typescript
 * //创建管理副作用实例
 * const ins = DebuffAction.create(() => {
 *     const delay = setTimeout(() => console.log("do something!"), 1000);
 *     return () => clearTimeout(delay);
 * });
 * 
 * //执行带副作用方法
 * ins.executeAnother(() => {
 *     const delay = setTimeout(() => console.log("do anthor thing!"), 100);
 *     return () => clearTimeout(delay);
 * });
 * 
 * //添加副作用方法
 * const a_delay = setTimeout(() => console.log("do something!"), 1000);
 * ins.appendDebuff(() => {
 *     console.log("debuff write here");
 *     clearTimeout(a_delay);
 * })
 * 
 * //执行副作用方法
 * ins.dispose();
 * 
 * ```
 */
export class DebuffAction {
    private debuff: Function[] = [];
    /**
     * 副作用释放
     */
    dispose = () => {
        this.debuff.forEach(item => {
            if (typeof item == "function") {
                item();
            }
        })
    }

    /**
     * 执行额外的方法
     * @param anotherAction 
     */
    executeAnother(anotherAction: () => any) {
        this.debuff.push(anotherAction());
    }
    /**
     * 添加待处理的副作用
     */
    appendDebuff(debuff: () => any) {
        this.debuff.push(debuff);
    }

    /**
     * 执行目标方法
     * @param action 目标方法
     */
    static create(action?: () => any) {
        const newAct = new DebuffAction();
        if (action) {
            newAct.debuff.push(action());
        }
        return newAct;
    }
}

