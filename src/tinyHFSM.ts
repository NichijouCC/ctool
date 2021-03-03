import { UUID } from "./uuid";

const PARENT = Symbol("parent");
const TRANSLATION_DIC = Symbol("TRANSLATION_DIC");
const UPDATE = Symbol("UPDATE");
const STATE_DIC = Symbol("STATE_DIC");
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
    readonly id = UUID.create_v4();
    name: string;
    [PARENT]: IStateMachine;
    get machine(): IStateMachine { return this[PARENT] };
    [TRANSLATION_DIC]: Map<IState, Omit<ITransition, "from">> = new Map();
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
        if (this[TRANSLATION_DIC].has(translation.to)) {
            let msg = `State:${this.name} already has translation to target(${translation.to.name})`;
            console.error(msg, translation);
            throw new Error(msg);
        }
        if (this[PARENT].hasState(translation.to)) {
            this[TRANSLATION_DIC].set(translation.to, translation);
        } else {
            let msg = `State:${this.name} cannot add translation to target(${translation.to.name}) which has not add to machine system（${this[PARENT].name}）`;
            console.error(msg, translation);
            throw new Error(msg);
        }
    }
    removeTranslation(to: IState) { this[TRANSLATION_DIC].delete(to); }

    onEnter(prev: IState): void { }
    onExit(next: IState): void { }
    [UPDATE](deltaTime: number) {
        for (const value of this[TRANSLATION_DIC].values()) {
            if (value.checkFunc) {
                let needTranslate = value.checkFunc(this[PARENT]?.store);
                if (needTranslate) this[PARENT].changToState(value.to);
                return;
            } else {
                this[PARENT].changToState(value.to);
                return;
            }
        }
        this.onUpdate(deltaTime);
    };
    onUpdate(deltaTime: number): void { }
}

export class EnterState extends HFSMState {
    addTranslation(translation: Omit<ITransition, "from">) {
        this[TRANSLATION_DIC].clear();
        super.addTranslation(translation);
    }
}
export class AnyState extends HFSMState { }

export class ExitState extends HFSMState { }

/**
 * 分层状态机
 */
export class TinyHFsm extends HFSMState implements IStateMachine {
    [STATE_DIC]: Map<string, IState> = new Map();
    enterState: IState = new EnterState();
    exitState: IState = new ExitState();
    anyState: IState = new AnyState();
    store: any;
    curState: IState;
    addState(state: IState): void { this[STATE_DIC].set(state.id, state); }
    hasState(state: IState) { return this[STATE_DIC].has(state.id); }
    removeState(state: IState): void { this[STATE_DIC].delete(state.id); }
    constructor(store: any) {
        super();
        this.store = store;
    }
    onEnter(prev: IState) { this.curState = this.enterState; }
    onExit(next: IState) { this.curState = null; }
    update(deltaTime: number) {
        this[UPDATE](deltaTime);
        if (this.curState) {
            this.curState[UPDATE](deltaTime);
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
        let current = this.curState;
        current.onExit(state);
        state.onEnter(current);
        this.curState = state;
    }
}

export interface IStateMachine extends IState {
    readonly enterState: IState;
    readonly exitState: IState;
    readonly anyState: IState;
    readonly store: any;
    readonly curState: IState;
    [STATE_DIC]: Map<string, IState>;
    addState(state: IState): void;
    removeState(state: IState): void;
    hasState(state: IState): boolean;

    changToState(state: string | IState): void;
    update(deltaTime: number): void;
}

export interface IState {
    readonly id: string;
    name: string;
    [PARENT]: IStateMachine;
    readonly machine: IStateMachine;
    [TRANSLATION_DIC]: Map<IState, Omit<ITransition, "from">>;
    [UPDATE](deltaTime: number): void;
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