import { expect } from "chai";
import { EventEmitter } from "node:events";
import { encodeFile } from "./base64";

describe("the base64 utility", () => {
    it("should encode png files to base64", () => {
        const encodedString = encodeFile("./test/resources/turtle.png");
        expect(encodedString).to.have.length.greaterThan(0);
    });

    it("should encode txt files to base64", () => {
        const encodedString = encodeFile("./test/resources/greetings.txt");
        expect(encodedString).to.eq("SGVsbG8gVGhlcmUh");
    });
});

describe("the event system", () => {
    const ee = new EventEmitter();

    const x = (s: string) => {
        console.log(s);
        console.log("done");
    };

    const subscribe = async (s: string) => {
        let output = 0;
        console.log(`before promise: ${s}`);
        await new Promise((resolve, reject) => {
            ee.on("go", (b: boolean) => {
                if (b) {
                    resolve(x(s));
                    output = 15;
                }
            });
            ee.on("no", () => reject(new Error(`rejected: ${s}`)));
        });
        console.log(`after promise: ${output}`);
    };

    it("should await somewhere", async () => {
        const p1 = subscribe("abc");
        const p2 = subscribe("xyz");
        console.log("here");
        setTimeout(() => {
            console.log("emitting 1");
            ee.emit("go", false);
            setTimeout(() => {
                console.log("emitting 2");
                ee.emit("no", true);
            }, 500);
        }, 500);
        console.log(await Promise.allSettled([p1, p2]));
    });
});
