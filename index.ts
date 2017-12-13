#!/usr/bin/env node
import { pathExistsSync, removeSync, readFile } from "fs-extra";
import "colors";
import * as program from "commander";
import { prompt, Answers } from "inquirer";
import * as path from "path";

import { version } from "./package.json";
import { createFiglet } from "./lib/figlet";
import { compile } from "handlebars";
import { Buffer } from "buffer";



const validate = require("validate-npm-package-name");
const download = require('download-git-repo');
const metalsmith = require('metalsmith');
const multimatch = require('multimatch');
const loading = require('ora');


// Verify the project name
const validateName = (name: string): string | boolean => {

  // check the project if already exists
  if (pathExistsSync(path.join(process.cwd(), name))) {
    return "The project already exists!".red
  }

  const v = validate(name)

  if ('errors' in v) {
    return v.errors[0].red
  } else if ('warnings' in v) {
    return v.warnings[0].yellow
  }

  return true
}

// Define the problem required to create the project
const questions = {
  //  project name
  pname() {
    return prompt({
      name: 'pname',
      message: 'project name:',
      validate(input:string) {
        return validateName(input)
      }
    })
  },
  // Front frame
  frame() {
    return prompt({
      type: 'list',
      name: 'frame',
      message: 'Which frame to use?',
      choices: ['react', 'vue']
    })
  },
  // script type
  script() {
    return prompt({
      type: 'list',
      name: 'script',
      message: 'Which script language to use?',
      choices: ['javascript', 'typescript']
    })
  },
  // style type
  style() {
    return prompt({
      type: 'list',
      name: 'style',
      message: 'Which style language to use?',
      choices: ['css', 'scss']
    })
  },
  // version
  version() {
    return prompt({
      name: 'version',
      message: 'version:',
      default: '1.0.0'
    })
  },
  // description
  description() {
    return prompt({
      name: 'description',
      message: 'description:',
    })
  },
  // author
  author(name: string, email: string) {
    return prompt({
      name: 'author',
      message: 'author:',
      default: `${name} <${email}>`
    })
  },
  // license
  license() {
    return prompt({
      name: 'license',
      message: 'license:',
      default: "MIT"
    })
  }
};

// download template
const downloadTemp = (path = "test", url: string = 'CloudDeng/vue-template') => {
  return new Promise((res, rej) => {
    download(url, path, (err: Error) => {
      if (err) {
        rej(err)
      } else {
        res()
      }
    })
  })
};


// render plugin
const renderPlugin = function (opts?: any) {
  return function (files: { [props: string]: any }, metalsmith: any, done: any) {
    // const pattern = opts.pattern || [];
    const data = metalsmith.metadata();
    // console.log(metalsmith)
    setImmediate(done);
    // console.log(files)
    Object.keys(files).forEach(function (file) {
      // if(multimatch(file, opts.pattern).length) {}
      const content = files[file].contents.toString();
      // if dont hash '{}' 
      if (/{{[^}]+}}/g.test(content)) {
        const newContent = compile(content)(data);
        files[file].contents = new Buffer(newContent);
      }
    });

  };
}


// render project template
const renderTemplate = function (targePath: string, ignore: string[], data: { [props: string]: any }) {
  return new Promise((res, rej) => {
    const fuc = metalsmith(__dirname)
      .metadata(data)
      .source('template')
      .ignore(['.gitignore', ...ignore])
      .destination(targePath)
      .clean(false)
      .use(renderPlugin())
      .build(function (err: Error) {
        if (err) {
          rej(err)
        } else {
          res()
        }
      })
  })


}

// create loading
const loadingAnim = function (tips: string) {
  return loading(tips);
}

// get git config
const getGitConfig = function (): Promise<{ name: string, email: string }> {
  return new Promise((res, rej) => {
    const gitConfigPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.gitconfig');
    readFile(gitConfigPath, function (err, data) {
      if (err) {
        rej(err)
      } else {
        const content = data.toString();
        let name = content.match(/name\s*=\s*([^=\n]*)/);
        let email = content.match(/email\s*=\s*([^=\n]*)/);
        res({ name: name ? name[1] : '', email: email ? email[1] : '' })
      }
    })
  })
}

  // todo:check the template




  // Start processing command line instructions
  ; (async () => {

    try {
      /**
       * @description create version and logo
       * @example zoom -V/--version
       */
      const logo = await createFiglet("myvue", 'Isometric1')
      program
        .version(`${logo.blue}  \n\n\r${('version:' + version).green.bgWhite}\n\r`)

      /**
       * @description creat action init and show the questions
       * @example zoom init [project-name]
       */
      program
        .command('init [project-name]')
        .description('create Vue project with [project-name]')
        .action(async function (name: string) {
          // catch the git config
          let username = '';
          let useremail = '';
          try {
            const info = await getGitConfig();
            username = info.name;
            useremail = info.email;
          } catch (error) {

          }


          // catch the project config
          try {
            let pname = name;
            let v = validateName(pname);
            if (v !== true) {
              console.log(v);
              const { pname: _pname } = (await questions.pname());
              pname = _pname
            }
            // catch the script style
            // todo: add select question
            const { script } = await questions.script();
            // const script = "javascript";
            // catch the css style
            const { style } = await questions.style();
            // catch the version
            const { version } = await questions.version();

            const { author } = await questions.author(username, useremail)
            const { description } = await questions.description();
            const { license } = await questions.license();

            // download the project from the github
            const localPath = path.join(__dirname, 'template');
            const targePath = path.join(process.cwd(), pname);
            const loadingAnim = loading({ frames: ['-', '+', '-'] });


            // delete template
            removeSync(localPath);

            loadingAnim.start('Please wait...');
            // download the template
            await downloadTemp(localPath)
            // render the project template
            const metadata = {
              package: {
                name: `"${pname}"`,
                version: `"${version}"`,
                description: `"${description || ''}"`,
                author: `"${author || ''}"`,
                license: `"${license || ''}"`,
                script:`"${script.toLowerCase()}"`,
                style:`"${style.toLowerCase()}"`,
                hasScss: style.toLowerCase() === "scss",
                hasTypescript: script.toLowerCase() === "typescript",
                logo
              }
            };

            // ignore some files
            const ignore = [];

            if (metadata.package.hasTypescript) {
              ignore.push('jsconfig.json','**/app/**/*.js')
            } else {
              ignore.push('tsconfig.json', '**/*.ts')
            }

            if (metadata.package.hasScss) {
              ignore.push('**/*.css')
            } else {
              ignore.push('**/*.scss')
            }

            await renderTemplate(targePath, ignore, metadata)
            loadingAnim.succeed(`Project has been created, don't forget to use ${'yarn install'.bgWhite.red} or ${'npm install'.bgWhite.red}!`);

          } catch (error) {
            console.log(error)
          }


        })
        .on('--help', function () {
          console.log('')
          console.log('  Examples:');
          console.log('')
          console.log('    $ zoom init [project name]')
          console.log('')
        })

      program
        .command('test')
        .action(function () {
          console.log(process.cwd())
          console.log(__dirname)
        })


      program.parse(process.argv);

    } catch (error) {
      console.log(error)
      process.exit(1)
    }

  })();