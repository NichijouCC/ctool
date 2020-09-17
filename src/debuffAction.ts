/**
 * 副作用方法管理
 * 
 * @description
 * 参考：react的useeffect
 * 
 * @example
 * ```typescript
 * DebuffAction.excute(() => {
 *     const delay = setTimeout(() => console.log("do something!"), 10000000);
 *     return () => clearTimeout(delay);
 * });
 * ```
 */
export class DebuffAction {
    private debuff: Function | undefined;
    /**
     * 副作用释放
     */
    dispose = () => {
        this.debuff?.();
    }

    /**
     * 执行目标方法
     * @param action 目标方法
     */
    static excute(action: () => Function) {
        const newAct = new DebuffAction();
        if (action) {
            newAct.debuff = action();
        }
        return newAct;
    }
}
