#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var fs_extra_1 = require("fs-extra");
require("colors");
var program = require("commander");
var inquirer_1 = require("inquirer");
var path = require("path");
var package_json_1 = require("./package.json");
var figlet_1 = require("./lib/figlet");
var handlebars_1 = require("handlebars");
var buffer_1 = require("buffer");
var validate = require("validate-npm-package-name");
var download = require('download-git-repo');
var metalsmith = require('metalsmith');
var multimatch = require('multimatch');
var loading = require('ora');
// Verify the project name
var validateName = function (name) {
    // check the project if already exists
    if (fs_extra_1.pathExistsSync(path.join(process.cwd(), name))) {
        return "The project already exists!".red;
    }
    var v = validate(name);
    if ('errors' in v) {
        return v.errors[0].red;
    }
    else if ('warnings' in v) {
        return v.warnings[0].yellow;
    }
    return true;
};
// Define the problem required to create the project
var questions = {
    //  project name
    pname: function () {
        return inquirer_1.prompt({
            name: 'pname',
            message: 'project name:',
            validate: function (input) {
                return validateName(input);
            }
        });
    },
    // Front frame
    frame: function () {
        return inquirer_1.prompt({
            type: 'list',
            name: 'frame',
            message: 'Which frame to use?',
            choices: ['react', 'vue']
        });
    },
    // script type
    script: function () {
        return inquirer_1.prompt({
            type: 'list',
            name: 'script',
            message: 'Which script language to use?',
            choices: ['javascript', 'typescript']
        });
    },
    // style type
    style: function () {
        return inquirer_1.prompt({
            type: 'list',
            name: 'style',
            message: 'Which style language to use?',
            choices: ['css', 'scss']
        });
    },
    // version
    version: function () {
        return inquirer_1.prompt({
            name: 'version',
            message: 'version:',
            default: '1.0.0'
        });
    },
    // description
    description: function () {
        return inquirer_1.prompt({
            name: 'description',
            message: 'description:',
        });
    },
    // author
    author: function (name, email) {
        return inquirer_1.prompt({
            name: 'author',
            message: 'author:',
            default: name + " <" + email + ">"
        });
    },
    // license
    license: function () {
        return inquirer_1.prompt({
            name: 'license',
            message: 'license:',
            default: "MIT"
        });
    }
};
// download template
var downloadTemp = function (path, url) {
    if (path === void 0) { path = "test"; }
    if (url === void 0) { url = 'CloudDeng/vue-template'; }
    return new Promise(function (res, rej) {
        download(url, path, function (err) {
            if (err) {
                rej(err);
            }
            else {
                res();
            }
        });
    });
};
// render plugin
var renderPlugin = function (opts) {
    return function (files, metalsmith, done) {
        // const pattern = opts.pattern || [];
        var data = metalsmith.metadata();
        // console.log(metalsmith)
        setImmediate(done);
        // console.log(files)
        Object.keys(files).forEach(function (file) {
            // if(multimatch(file, opts.pattern).length) {}
            var content = files[file].contents.toString();
            // if dont hash '{}' 
            if (/{{[^}]+}}/g.test(content)) {
                var newContent = handlebars_1.compile(content)(data);
                files[file].contents = new buffer_1.Buffer(newContent);
            }
        });
    };
};
// render project template
var renderTemplate = function (targePath, ignore, data) {
    return new Promise(function (res, rej) {
        var fuc = metalsmith(__dirname)
            .metadata(data)
            .source('template')
            .ignore(['.gitignore'].concat(ignore))
            .destination(targePath)
            .clean(false)
            .use(renderPlugin())
            .build(function (err) {
            if (err) {
                rej(err);
            }
            else {
                res();
            }
        });
    });
};
// create loading
var loadingAnim = function (tips) {
    return loading(tips);
};
// get git config
var getGitConfig = function () {
    return new Promise(function (res, rej) {
        var gitConfigPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.gitconfig');
        fs_extra_1.readFile(gitConfigPath, function (err, data) {
            if (err) {
                rej(err);
            }
            else {
                var content = data.toString();
                var name = content.match(/name\s*=\s*([^=\n]*)/);
                var email = content.match(/email\s*=\s*([^=\n]*)/);
                res({ name: name ? name[1] : '', email: email ? email[1] : '' });
            }
        });
    });
};
(function () { return __awaiter(_this, void 0, void 0, function () {
    var logo_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, figlet_1.createFiglet("zoom", 'Isometric1')];
            case 1:
                logo_1 = _a.sent();
                program
                    .version(logo_1.blue + "  \n\n\r" + ('version:' + package_json_1.version).green.bgWhite + "\n\r");
                /**
                 * @description creat action init and show the questions
                 * @example zoom init [project-name]
                 */
                program
                    .command('init [project-name]')
                    .description('create Vue project with [project-name]')
                    .action(function (name) {
                    return __awaiter(this, void 0, void 0, function () {
                        var username, useremail, info, error_2, pname, v, _pname, script, style, version_1, author, description, license, localPath, targePath, loadingAnim_1, metadata, ignore, error_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    username = '';
                                    useremail = '';
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, getGitConfig()];
                                case 2:
                                    info = _a.sent();
                                    username = info.name;
                                    useremail = info.email;
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_2 = _a.sent();
                                    return [3 /*break*/, 4];
                                case 4:
                                    _a.trys.push([4, 15, , 16]);
                                    pname = name;
                                    v = validateName(pname);
                                    if (!(v !== true)) return [3 /*break*/, 6];
                                    console.log(v);
                                    return [4 /*yield*/, questions.pname()];
                                case 5:
                                    _pname = (_a.sent()).pname;
                                    pname = _pname;
                                    _a.label = 6;
                                case 6: return [4 /*yield*/, questions.script()];
                                case 7:
                                    script = (_a.sent()).script;
                                    return [4 /*yield*/, questions.style()];
                                case 8:
                                    style = (_a.sent()).style;
                                    return [4 /*yield*/, questions.version()];
                                case 9:
                                    version_1 = (_a.sent()).version;
                                    return [4 /*yield*/, questions.author(username, useremail)];
                                case 10:
                                    author = (_a.sent()).author;
                                    return [4 /*yield*/, questions.description()];
                                case 11:
                                    description = (_a.sent()).description;
                                    return [4 /*yield*/, questions.license()];
                                case 12:
                                    license = (_a.sent()).license;
                                    localPath = path.join(__dirname, 'template');
                                    targePath = path.join(process.cwd(), pname);
                                    loadingAnim_1 = loading({ frames: ['-', '+', '-'] });
                                    // delete template
                                    fs_extra_1.removeSync(localPath);
                                    loadingAnim_1.start('Please wait...');
                                    // download the template
                                    return [4 /*yield*/, downloadTemp(localPath)
                                        // render the project template
                                    ];
                                case 13:
                                    // download the template
                                    _a.sent();
                                    metadata = {
                                        package: {
                                            name: "\"" + pname + "\"",
                                            version: "\"" + version_1 + "\"",
                                            description: "\"" + (description || '') + "\"",
                                            author: "\"" + (author || '') + "\"",
                                            license: "\"" + (license || '') + "\"",
                                            script: "\"" + script.toLowerCase() + "\"",
                                            style: "\"" + style.toLowerCase() + "\"",
                                            hasScss: style.toLowerCase() === "scss",
                                            hasTypescript: script.toLowerCase() === "typescript",
                                            logo: logo_1
                                        }
                                    };
                                    ignore = [];
                                    if (metadata.package.hasTypescript) {
                                        ignore.push('jsconfig.json', '**/app/**/*.js');
                                    }
                                    else {
                                        ignore.push('tsconfig.json', '**/*.ts');
                                    }
                                    if (metadata.package.hasScss) {
                                        ignore.push('**/*.css');
                                    }
                                    else {
                                        ignore.push('**/*.scss');
                                    }
                                    return [4 /*yield*/, renderTemplate(targePath, ignore, metadata)];
                                case 14:
                                    _a.sent();
                                    loadingAnim_1.succeed("Project has been created, don't forget to use " + 'yarn install'.bgWhite.red + " or " + 'npm install'.bgWhite.red + "!");
                                    return [3 /*break*/, 16];
                                case 15:
                                    error_3 = _a.sent();
                                    console.log(error_3);
                                    return [3 /*break*/, 16];
                                case 16: return [2 /*return*/];
                            }
                        });
                    });
                })
                    .on('--help', function () {
                    console.log('');
                    console.log('  Examples:');
                    console.log('');
                    console.log('    $ zoom init [project name]');
                    console.log('');
                });
                program
                    .command('test')
                    .action(function () {
                    console.log(process.cwd());
                    console.log(__dirname);
                });
                program.parse(process.argv);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.log(error_1);
                process.exit(1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); })();
