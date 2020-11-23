const file_prefix = process.argv[2];
const path = require("path");
const fs = require("fs");
const exec = require('child_process').exec;
let src_dir = path.resolve("./src");
fs.readdir(src_dir, (err, items) => {
    for (let i = 0; i < items.length; i++) {
        if (items[i].startsWith(file_prefix)) {
            console.warn(`@@------------执行：${items[i]}-----------------------`);
            exec(`ts-node ${path.resolve(src_dir, items[i])}`, (err, out) => {
                if (err) {
                    console.log(err);
                }
                console.log(out);
            });
            break;
        }
    }
});