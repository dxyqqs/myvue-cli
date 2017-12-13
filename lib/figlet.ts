
const figlet = require('figlet');

export function createFiglet(word: string, font: string = "Standard"): Promise<string> {
  return new Promise((res, rej) => {
    figlet.text(word, { font }, function (err: any, data: string) {
      if (err) {
        rej(err)
      } else {
        // res(data.replace(/[\n\r\s]*$/, ''))
        res(data)
      }
    })
  })
}