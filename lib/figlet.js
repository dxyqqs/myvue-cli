"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var figlet = require('figlet');
function createFiglet(word, font) {
    if (font === void 0) { font = "Standard"; }
    return new Promise(function (res, rej) {
        figlet.text(word, { font: font }, function (err, data) {
            if (err) {
                rej(err);
            }
            else {
                // res(data.replace(/[\n\r\s]*$/, ''))
                res(data);
            }
        });
    });
}
exports.createFiglet = createFiglet;
