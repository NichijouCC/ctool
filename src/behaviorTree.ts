import { EventTarget } from "./eventTarget";
import { Timer } from "./timer";

export type BVNodeResult = "SUCCESS" | "FAILED" | "RUNNING";
export type BVNodeState = "INIT" | "RUNNING" | "END";

interface IBVNode {
    readonly parent: IBVNode;
    currentResult: BVNodeResult;
    execute<T = any>(blackBoard: T): BVNodeResult
    rest(): void;
    [INTERNAL_TICK](blackBoard: any): BVNodeResult
}

class BaseNode implements IBVNode {
    /**
     * private
     */
    _parent: BaseNode;
    get parent() { return this._parent; }
    currentResult: BVNodeResult;
    protected _currentState: BVNodeState = "INIT";
    protected _tree: BehaviorTree;
    constructor(bvTree?: BehaviorTree) {
        this._tree = bvTree;
    }
    protected _enter(blackBoard: any) {
        this._currentState = "RUNNING";
        this.onEnter(blackBoard);
    }
    protected _exit(blackBoard: any) {
        this._currentState = "END";
        this.onExit(blackBoard);
    }

    protected _execute(blackBoard: any) {
        return this.execute(blackBoard);
    }
    [INTERNAL_TICK](blackBoard: any): BVNodeResult {
        if (this._currentState == "INIT") {
            this._enter(blackBoard);
        }

        if (this._currentState == "RUNNING") {
            let result = this._execute(blackBoard);
            if (result != "RUNNING") {
                this._exit(blackBoard);
            } else {
                this._tree[RUNNING_NODE] = this;
            }
            this.currentResult = result;
        }

        if (this._currentState == "END") {
            return this.currentResult;
        }
    }

    onEnter<T = any>(blackBoard: T) { }
    onExit<T = any>(blackBoard: T) { }
    rest() { this._currentState = "INIT"; this.currentResult = null; }
    execute<T = any>(blackBoard: T): BVNodeResult { return "SUCCESS" }
}

/**
 * 行为节点
 * 
 * 实际干事的节点
 */
export abstract class ActionNode extends BaseNode {
    protected _execute(blackBoard: any) {
        let result = super._execute(blackBoard);
        if (result == "RUNNING") {
            this._tree[RUNNING_NODE] = this;
        } else if (this._tree[RUNNING_NODE] == this) {
            //执行完毕
            this._tree[RUNNING_NODE] = null;
        }
        return result;
    }
    abstract execute<T = any>(blackBoard: T): BVNodeResult;
}

class LogicNode extends BaseNode {
    private _child: BaseNode;
    set child(item: BaseNode) {
        if (this._child) this._child._parent = null;
        this._child = item;
        item._parent = this;
    };
    get child() { return this._child };
}

/**
 * 条件节点
 * 
 * 对子节点的执行附加前置执行条件
 */
export abstract class ConditionNode extends LogicNode {
    execute<T = any>(blackBoard: T): BVNodeResult {
        let result = this.check(blackBoard);
        if (result == "SUCCESS") {
            if (this.child != null) {
                return this.child[INTERNAL_TICK](blackBoard);
            }
        } else {
            return result
        }
    }
    rest() {
        super.rest();
        this.child?.rest();
    }
    abstract check<T = any>(blackBoard: T): "SUCCESS" | "FAILED"
}

/**
 * 装饰器节点
 * 
 * 对子节点的输出结果进行二次加工
 */
export abstract class DecoratorNode extends LogicNode {
    execute<T = any>(blackBoard: T): BVNodeResult {
        if (this.child == null) return "FAILED";
        let result = this.child[INTERNAL_TICK](blackBoard);
        return this.decorate(result, blackBoard);
    }
    rest() {
        super.rest();
        this.child.rest();
    }
    abstract decorate<T = any>(childResult: BVNodeResult, blackBoard: T): BVNodeResult
}

//------------------------------组合节点
class CompositeNode extends BaseNode {
    children: BaseNode[] = [];
    addChild(node: BaseNode) {
        this.children.push(node);
        node._parent = this;
    }
    removeChild(node: BaseNode) {
        let index = this.children.indexOf(node);
        if (index >= 0) {
            this.children.splice(index, 1);
            node._parent = null;
        }
    }
    rest() {
        super.rest();
        this.children.forEach(item => item.rest())
    }
}
/**
 * 序列执行节点
 * 
 * 如果一个子节点执行失败，就返回，其余子节点就不再执行
 */
export class Sequence extends CompositeNode {
    execute<T = any>(blackBoard: T): BVNodeResult {
        if (this.children.length == 0) return "FAILED";
        for (let i = 0; i < this.children.length; i++) {
            let result = this.children[i][INTERNAL_TICK](blackBoard);
            if (result != "SUCCESS") return result;
        }
        return "SUCCESS";
    }
}

/**
 * 序列执行节点
 * 
 * 当子节点只要有一个成功，就返回，其余节点不再执行
 */
export class Selector extends CompositeNode {
    execute<T = any>(blackBoard: T): BVNodeResult {
        if (this.children.length == 0) return "FAILED";
        for (let i = 0; i < this.children.length; i++) {
            let result = this.children[i][INTERNAL_TICK](blackBoard);
            if (result == "SUCCESS") return result;
        }
        return "FAILED"
    }
}

/**
 * 并发执行子节点
 * 
 * 如果一个子节点执行失败，就返回，其余子节点就不再执行
 */
export class ParallelSequence extends CompositeNode {
    execute<T = any>(blackBoard: T): BVNodeResult {
        if (this.children.length == 0) return "FAILED";
        let result: BVNodeResult = "SUCCESS"
        for (let i = 0; i < this.children.length; i++) {
            let childResult = this.children[i][INTERNAL_TICK](blackBoard);
            if (childResult != "SUCCESS") result = childResult;
        }
        return result;
    }
}

/**
 * 并发执行子节点
 * 
 * 当子节点只要有一个成功，就返回，其余节点不再执行
 */
export class ParallelSelector extends CompositeNode {
    execute<T = any>(blackBoard: T): BVNodeResult {
        if (this.children.length == 0) return "FAILED";
        let result: BVNodeResult = "FAILED"
        for (let i = 0; i < this.children.length; i++) {
            let childResult = this.children[i][INTERNAL_TICK](blackBoard);
            if (childResult == "SUCCESS") result = childResult;
        }
        return result;
    }
}

const RUNNING_NODE = Symbol("runningNode");
const INTERNAL_TICK = Symbol("internalTick");

/**
 * 行为树
 * 
 * 每个节点都拥有执行状态：待执行、执行中、执行结束  
 * 每个节点都拥有执行结果：执行中、成功、失败
 */
export class BehaviorTree {
    readonly root = new BaseNode(this);
    [RUNNING_NODE]: BaseNode;
    blackBoard: any;
    private _autoTick: boolean;
    private _timer: Timer;
    /**
     * 新建
     * @param options.blackBoard 行为树的数据中心
     * @param options.autoTick 是否自动tick执行
     */
    constructor(options?: { blackBoard?: any, autoTick?: boolean }) {
        this._autoTick = options?.autoTick ?? true;
        this.blackBoard = options?.blackBoard ?? {};
        if (this._autoTick) {
            let timer = new Timer();
            timer.tick.addEventListener(this.tick);
            this._timer = timer;
        }
    }

    /**
     * tick执行事件
     */
    onTick = new EventTarget();

    /**
     * one tick 执行触发
     */
    tick = () => {
        if (this._destroyed) return;
        this.onTick.raiseEvent();
        let state = this._execute();
        if (state != "RUNNING") {//整个树执行完了
            this.rest();
        }
    }

    /**
     * 重置行为树到待执行状态
     * 
     * 用途：打断当前节点的执行，重新决策
     */
    rest = () => {
        this[RUNNING_NODE] = null;
        this.root.rest();
    }

    private _destroyed = false;

    /**
     * 销毁
     */
    close() {
        this._destroyed = true;
        this._timer?.dispose();
        this.onTick.dispose();
    }

    private _execute() {
        if (this[RUNNING_NODE]) {
            return this[RUNNING_NODE].parent[INTERNAL_TICK](this.blackBoard);
        } else {
            return this.root[INTERNAL_TICK](this.blackBoard);
        }
    }
}
