/**
 * 副作用管理
 */
export class DebuffAction {
    private debuff: Function | undefined;
    dispose = () => {
        this.debuff?.();
    }

    static excute(action: () => Function) {
        const newAct = new DebuffAction();
        if (action) {
            newAct.debuff = action();
        }
        return newAct;
    }
}
