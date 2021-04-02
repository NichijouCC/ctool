export type BVNodeResult = "SUCCESS" | "FAILED" | "RUNNING";
interface IBVNode {
    currentState: BVNodeResult;
    execute<T = any>(blackBoard: T): BVNodeResult
    tick<T = any>(blackBoard: T): BVNodeResult
}

class BaseNode implements IBVNode {
    currentState: BVNodeResult;
    tick<T = any>(blackBoard: T): BVNodeResult {
        let result = this.execute(blackBoard);
        return result;
    }
    execute<T = any>(blackBoard: T): BVNodeResult { return "SUCCESS" }
}
//----------------行为节点
export abstract class ActionNode extends BaseNode {
    enter<T = any>(blackBoard: T) { }
    exit<T = any>(blackBoard: T) { }
    tick<T = any>(blackBoard: T): BVNodeResult {
        if (this.currentState != "RUNNING") this.enter(blackBoard);
        let result = this.execute(blackBoard);
        if (result != "RUNNING") this.exit(blackBoard);
        this.currentState = result;
        return result;
    }
    abstract execute<T = any>(blackBoard: T): BVNodeResult;
}

//----------------条件节点
export abstract class ConditionNode extends BaseNode {
    child: BaseNode;
    execute<T = any>(blackBoard: T): BVNodeResult {
        let result = this.check(blackBoard);
        if (result == "SUCCESS") {
            return this.child.tick(blackBoard);
        } else {
            return result
        }
    }
    abstract check<T = any>(blackBoard: T): "SUCCESS" | "FAILED"
}

//--------------装饰器节点
export abstract class DecoratorNode extends BaseNode {
    child: BaseNode;
    execute<T = any>(blackBoard: T): BVNodeResult {
        let result = this.child.tick(blackBoard);
        return this.decorate(result, blackBoard);
    }
    abstract decorate<T = any>(childResult: BVNodeResult, blackBoard: T): BVNodeResult
}

//------------------------------组合节点
class CompositeNode extends BaseNode {
    children: IBVNode[] = [];
    addChild(node: IBVNode) {
        this.children.push(node);
    }
    removeChild(node: IBVNode) {
        let index = this.children.indexOf(node);
        if (index >= 0) {
            this.children.splice(index, 1);
        }
    }
}

export class Sequence extends CompositeNode {
    execute<T = any>(blackBoard: T): BVNodeResult {
        if (this.children.length == 0) return "FAILED";
        for (let i = 0; i < this.children.length; i++) {
            let result = this.children[i].tick(blackBoard);
            if (result != "SUCCESS") return result;
        }
        return "SUCCESS";
    }
}

export class Selector extends CompositeNode {
    execute<T = any>(blackBoard: T): BVNodeResult {
        if (this.children.length == 0) return "FAILED";
        for (let i = 0; i < this.children.length; i++) {
            let result = this.children[i].tick(blackBoard);
            if (result == "SUCCESS") return result;
        }
        return "FAILED"
    }
}

export class ParallelSequence extends CompositeNode {
    execute<T = any>(blackBoard: T): BVNodeResult {
        if (this.children.length == 0) return "FAILED";
        let result: BVNodeResult = "SUCCESS"
        for (let i = 0; i < this.children.length; i++) {
            let childResult = this.children[i].tick(blackBoard);
            if (childResult != "SUCCESS") result = childResult;
        }
        return result;
    }
}

export class ParallelSelector extends CompositeNode {
    execute<T = any>(blackBoard: T): BVNodeResult {
        if (this.children.length == 0) return "FAILED";
        let result: BVNodeResult = "FAILED"
        for (let i = 0; i < this.children.length; i++) {
            let childResult = this.children[i].tick(blackBoard);
            if (childResult == "SUCCESS") result = childResult;
        }
        return result;
    }
}


export class BehaviorTree {
    private root = new BaseNode();
}
