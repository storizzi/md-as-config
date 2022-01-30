const fs = require('fs');
const MDClass = require('../MDTools')

var paramStr = process.argv[2]

let md = new MDClass(paramStr?paramStr:'./test.md')
let settings = md.settings

console.log(JSON.stringify(md,null,3))