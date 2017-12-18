#!/usr/bin/env node
import "colors";
import * as program from "commander";
import { pathExistsSync, removeSync, readFile } from "fs-extra";
import { prompt, Answers } from "inquirer";
import * as path from "path";
import { compile } from "handlebars";
import { Buffer } from "buffer";

import { version } from "./package.json";
import { createFiglet } from "./lib/figlet";
import { start } from "repl";
const validate = require("validate-npm-package-name");
const download = require('download-git-repo');
const metalsmith = require('metalsmith');
const loading = require('ora');

// Verify the project name
const validateName = (name: string): string | boolean => {

  // check the project if already exists
  if (name && pathExistsSync(path.join(process.cwd(), name))) {
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
      validate(input: string) {
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
const downloadTemp = (path = "test", url: string = 'dxyqqs/myvue-temp') => {
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
      // if dont has '{}' 
      if (/{{[^}]+}}/g.test(content)) {
        const newContent = compile(content)(data);
        files[file].contents = new Buffer(newContent);
      }
      if (opts) {
        const names = Object.keys(opts);
        if (names.length) {
          const name = names.find(e => opts[e].test(file))
          if (name) {
            files[path.join(path.dirname(file), name)] = files[file];
            delete files[file];
          }
        }
      }
    });

  };
}


// render project template
const renderTemplate = function (targePath: string, ignore: string[], data: { [props: string]: any }, source: string = "template", rename?: { [name: string]: RegExp }) {
  return new Promise((res, rej) => {
    const fuc = metalsmith(__dirname)
      .metadata(data)
      .source(source)
      .ignore(['.gitignore', ...ignore])
      .destination(targePath)
      .clean(false)
      .use(renderPlugin(rename))
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

    const loadingAnim = loading({ frames: ['-', '+', '-'] });
    const localPath = path.join(__dirname, 'template');
    try {
      /**
       * @description create version and logo
       * @example myvue -V/--version
       */

      const logo = await createFiglet("myvue", 'Isometric1');
      const ver_logo = `${logo.blue}  \n\n\r ${('version:' + version).green.bgWhite}\n\r`;
      program
        .version(ver_logo)
      /**
       * @description create action init and show the questions
       * @example myvue init [project-name]
       */
      program
        .command('init <project-name>')
        .description('create Vue project with <project-name>')
        .action(async function (name: string) {
          // get the git config
          let username = '';
          let useremail = '';
          try {
            const gitConfig = await getGitConfig();
            username = gitConfig.name;
            useremail = gitConfig.email;
          } catch (error) { }


          // catch the project config
          try {
            let pname = name;
            let v = validateName(pname);
            if (v !== true) {
              console.log(v);
              const { pname: _pname } = (await questions.pname());
              pname = _pname
            }


            const { script } = await questions.script();

            const { style } = await questions.style();

            const { version } = await questions.version();

            const { author } = await questions.author(username, useremail)

            const { description } = await questions.description();

            const { license } = await questions.license();


            // download the project from the github
            const targePath = path.join(process.cwd(), pname);

            loadingAnim.start('Please wait...');
            // delete template
            removeSync(localPath);
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
                script: `"${script.toLowerCase()}"`,
                style: `"${style.toLowerCase()}"`,
                hasScss: style.toLowerCase() === "scss",
                hasTypescript: script.toLowerCase() === "typescript",
                logo
              }
            };

            // ignore some files
            const ignore = ['**/comp_temp/**/*'];

            if (metadata.package.hasTypescript) {
              ignore.push('jsconfig.json', '**/app/**/*.js')
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
            throw error;
          }


        })
        .on('--help', function () {
          console.log('')
          console.log('  Examples:');
          console.log('')
          console.log('    $ myvue init <project-name>')
          console.log('')
        })

      /**
       * @description create action component
       * @example myvue component/comp name -t -s
       */
      program
        .command('component <component-name>')
        .description('create Vue component with <component-name>')
        .alias('comp')
        .option('-T,--typescript', 'use typescript')
        .option('-S,--scss', 'use scss')
        .action(async function (name, options) {

          try {
            const componentName = name;
            const hasScss = !!options.scss;
            const hasTypescript = !!options.typescript;
            const rename = {
              [`${name}.vue`]: /template\.vue/
            };
            loadingAnim.start('Please wait...');
            removeSync(localPath);
            await downloadTemp(localPath)
            await renderTemplate(path.join(process.cwd(), componentName), [], { component: { name, hasScss, hasTypescript } }, 'template/comp_temp', rename)

            loadingAnim.succeed(`Component ${(name).red} has been created!`);

          } catch (error) {
            throw error;
          }
        })
        .on('--help', () => {
          console.log('')
          console.log('  Examples:');
          console.log('')
          console.log('    $ myvue component|comp [-S|--scss][-T|--typescript] <component-name>')
          console.log('')
        });
      // help
      program
        .on('--help', () => {
          console.log('')
          console.log('  Examples:');
          console.log('')
          console.log('    $ myvue init [project-name]')
          console.log('    $ myvue component|comp [-S|--scss][-T|--typescript] <component-name>')
          console.log('')
        })
      // run
      program
        .parse(process.argv)

      if (!program.args.length) program.help()

    } catch (error) {
      console.log(error)
      process.exit(1)
    }

  })();



