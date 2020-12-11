import { describe, it } from "mocha";
import { Classify } from "../src/index";
import { expect } from "chai";

describe("Classify", () => {
    describe("arrayToArray", () => {
        it("classify mutiply layer", () => {
            let newArr = Classify.arrayToArray(
                [{ a: 1, b: 1 }, { a: 1, b: 3 }, { a: 2, b: 2 }, { a: 3, b: 2 }, { a: 4, b: 3 }, { a: 5, b: 3, c: 4 }, { a: 1, b: 3, c: 5 }],
                {
                    itemToKey: item => item.a,
                },
                {
                    itemToKey: item => item.b,
                },
                {
                    itemToKey: item => item.c,
                }
            )
            expect(newArr.length).to.equal(5);
            let layer_a_1 = newArr.find(item => item.key == 1);
            let layer_a_2 = newArr.find(item => item.key == 2);
            expect(layer_a_1.key).to.equal(1);
            expect(layer_a_1.child.length).to.equal(2);//a1下面2个b【1,3】
            expect(layer_a_2.key).to.equal(2);
            expect(layer_a_2.child.length).to.equal(1);//a2下面1个b【2】
            let layer_a_1_b_3: { key: any, child: any[] } = layer_a_1.child.find(item => item.key == 3);
            let layer_a_1_b_1 = layer_a_1.child.find(item => item.key = 1);
            expect(layer_a_1_b_3.key).to.equal(3);//
            expect(layer_a_1_b_3.child.length).to.equal(2);//a1_b3下面2个c【null,5】
            expect(layer_a_1_b_1.key).to.equal(1);//
            expect(layer_a_1_b_1.child.length).to.equal(1);//a1_b1下面1个c【null】

            let layer_a1_b3_c5 = layer_a_1_b_3.child.find(item => item.key == 5);
            expect(layer_a1_b3_c5.child.length).to.equal(1);//layer_a1_b3_c5下面1个元素【{ a: 1, b: 3, c: 5 }】
        });

        it("key transform", () => {
            let newArr = Classify.arrayToArray(
                [{ a: 1, b: 1 }, { a: 1, b: 3 }, { a: 2, b: 2 }, { a: 3, b: 2 }, { a: 4, b: 3 }, { a: 5, b: 3, c: 4 }, { a: 1, b: 3, c: 5 }],
                {
                    itemToKey: item => item.a,
                    keyTransformt: key => { return { newKey: key, layer: 1 } }
                },
                {
                    itemToKey: item => item.b,
                    keyTransformt: key => { return { newKey: key, layer: 2 } }
                },
                {
                    itemToKey: item => item.c,
                    keyTransformt: key => { return { newKey: key, layer: 3 } }
                }
            )
            expect(newArr.length).to.equal(5);
            let layer_a_1 = newArr.find(item => item.newKey == 1);
            let layer_a_2 = newArr.find(item => item.newKey == 2);
            expect(layer_a_1.key).to.equal(undefined);
            expect(layer_a_1.newKey).to.equal(1);
            expect(layer_a_1.layer).to.equal(1);
            expect(layer_a_2.newKey).to.equal(2);

            let layer_a_1_b_3: { newKey: any, key: any, child: any[] } = layer_a_1.child.find(item => item.newKey == 3);
            let layer_a_1_b_1 = layer_a_1.child.find(item => item.newKey = 1);
            expect(layer_a_1_b_3.key).to.equal(undefined);
            expect(layer_a_1_b_3.newKey).to.equal(3);

            let layer_a1_b3_c5 = layer_a_1_b_3.child.find(item => item.newKey == 5);
            expect(layer_a1_b3_c5.newKey).to.equal(5);
        });
    })

    describe("arrayToMap", () => {
        it("classify mutiply layer", () => {
            let newArr = Classify.arrayToMap(
                [{ a: 1, b: 1 }, { a: 1, b: 3 }, { a: 2, b: 2 }, { a: 3, b: 2 }, { a: 4, b: 3 }, { a: 5, b: 3, c: 4 }, { a: 1, b: 3, c: 5 }],
                item => item.a,
                item => item.b,
                item => item.c
            );
            expect(Array.from(newArr.keys()).length).to.equal(5);
            let layer_a_2 = newArr.get(2);
            expect(layer_a_2 != null).to.equal(true);
            let layer_a_1: Map<number, any> = newArr.get(1);
            expect(layer_a_1 != null).to.equal(true);
            let layer_a1_b1: Map<number, any> = layer_a_1.get(1);
            expect(layer_a1_b1 != null).to.equal(true);
            expect(Array.from(layer_a1_b1.keys()).length).to.equal(1);
            let layer_a1_b3: Map<number, any> = layer_a_1.get(3);
            expect(Array.from(layer_a1_b3.keys()).length).to.equal(2);
        });
    });
});
