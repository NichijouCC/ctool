import { UUID } from "./UUID";

export namespace Private {
    export const PARENT = Symbol("PARENT");
    export const TRANSLATION_DIC = Symbol("TRANSLATION_DIC");
    export const UPDATE = Symbol("UPDATE");
    export const STATE_DIC = Symbol("STATE_DIC");
}

/**
 * 分层状态机：状态连线
 */
export class FsmTranslation implements ITransition {
    from: HFSMState;
    to: HFSMState;
    checkFunc?: (store: any) => boolean;
}
/**
 * 分层状态机子状态
 */
export class HFSMState implements IState {
    readonly id: string;
    readonly name: string;
    enableTranslate = true;
    [Private.PARENT]: IStateMachine;
    get machine(): IStateMachine { return this[Private.PARENT] };
    [Private.TRANSLATION_DIC]: Map<IState, Omit<ITransition, "from">>

    constructor() {
        this.id = UUID.create_v4()
        this[Private.TRANSLATION_DIC] = new Map();
        this.name = this.constructor.name;
    }

    /**
     * 添加同层级子状态连线
     * @param translation 
     */
    addTranslation(translation: Omit<ITransition, "from">): void {
        if (translation?.to == null) {
            let msg = `"to" in translation must not be null`;
            console.error(msg, translation);
            throw new Error(msg);
        };
        if (this[Private.TRANSLATION_DIC].has(translation.to)) {
            let msg = `State:${this.name} already has translation to target(${translation.to.name})`;
            console.error(msg, translation);
            throw new Error(msg);
        }
        if (this[Private.PARENT].hasState(translation.to)) {
            this[Private.TRANSLATION_DIC].set(translation.to, translation);
        } else {
            let msg = `State:${this.name} cannot add translation to target(${translation.to.name}) which has not add to machine system（${this[Private.PARENT].name}）`;
            console.error(msg, translation);
            throw new Error(msg);
        }
    }
    removeTranslation(to: IState) { this[Private.TRANSLATION_DIC].delete(to); }

    onEnter(prev: IState): void { }
    onExit(next: IState): void { }
    [Private.UPDATE](deltaTime: number) {
        if (this.enableTranslate) {
            for (const value of this[Private.TRANSLATION_DIC].values()) {
                if (value.checkFunc) {
                    let needTranslate = value.checkFunc(this[Private.PARENT]?.store);
                    if (needTranslate) {
                        this[Private.PARENT].changToState(value.to);
                        return;
                    }
                } else {
                    this[Private.PARENT].changToState(value.to);
                    return;
                }
            }
        }
        this.onUpdate(deltaTime);
    };
    onUpdate(deltaTime: number): void { }
}

export class EnterState extends HFSMState {
    addTranslation(translation: Omit<ITransition, "from">) {
        this[Private.TRANSLATION_DIC].clear();
        super.addTranslation(translation);
    }
}
export class AnyState extends HFSMState { }

export class ExitState extends HFSMState { }

/**
 * 分层状态机
 */
export class TinyHFsm<T = any> extends HFSMState implements IStateMachine {
    [Private.STATE_DIC]: Map<string, IState>;
    enterState: IState;
    exitState: IState;
    anyState: IState;
    store: T;
    curState: IState;
    addState(state: IState | IState[]): void {
        if (state instanceof Array) {
            for (let el of state) {
                this[Private.STATE_DIC].set(el.id, el);
                el[Private.PARENT] = this;
            }
        } else {
            this[Private.STATE_DIC].set(state.id, state);
            state[Private.PARENT] = this;
        }
    }
    hasState(state: IState) { return this[Private.STATE_DIC].has(state.id); }
    removeState(state: IState): void { this[Private.STATE_DIC].delete(state.id); }
    constructor(store: T) {
        super();
        this.store = store;
        this[Private.STATE_DIC] = new Map();
        this.enterState = new EnterState();
        this.exitState = new ExitState();
        this.anyState = new AnyState();
        this.addState([this.enterState, this.exitState, this.anyState]);
        this.curState = this.enterState;
    }
    onEnter(prev: IState) { this.curState = this.enterState; }
    onExit(next: IState) { this.curState = null; }
    update(deltaTime: number) {
        this[Private.UPDATE](deltaTime);
        this.anyState[Private.UPDATE](deltaTime);
        if (this.curState) {
            this.curState[Private.UPDATE](deltaTime);
        }
    }
    /**
     * 添加子状态连线
     * @param translation 
     */
    addChildStateTranslation(translation: ITransition) {
        if (!this.hasState(translation.from)) {
            let msg = `FromTarget(${translation.from.name}) of translation has not add to machine system(${this.name})`;
            console.error(msg, translation);
            throw new Error(msg);
        }
        translation.from.addTranslation(translation);
    }
    /**
     * 主动修改状态
     * @param state 
     */
    changToState(state: IState): void {
        if (state != this.curState) {
            // console.log(`fsm translate from ${this.curState?.name} to ${state.name}`);
            let current = this.curState;
            current.onExit(state);
            state.onEnter(current);
            this.curState = state;
        }
    }
}

export interface IStateMachine<T = any> extends IState {
    readonly enterState: IState;
    readonly exitState: IState;
    readonly anyState: IState;
    readonly store: T;
    readonly curState: IState;
    [Private.STATE_DIC]: Map<string, IState>;
    addState(state: IState): void;
    removeState(state: IState): void;
    hasState(state: IState): boolean;

    changToState(state: string | IState): void;
    update(deltaTime: number): void;
}

export interface IState {
    readonly id: string;
    name: string;
    [Private.PARENT]: IStateMachine;
    readonly machine: IStateMachine;
    [Private.TRANSLATION_DIC]: Map<IState, Omit<ITransition, "from">>;
    [Private.UPDATE](deltaTime: number): void;
    addTranslation(translation: Omit<ITransition, "from">): void;
    removeTranslation(to: IState): void;
    onEnter(prev: IState): void;
    onExit(next: IState): void;
    onUpdate(deltaTime: number): void;
}

export interface ITransition {
    from: IState;
    to: IState
    checkFunc?: (store: any) => boolean;
}