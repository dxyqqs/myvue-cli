declare module "*.json" {
  export const version: string;
}

declare module "figlet" {
  interface FigletOpt {
    font?: string;
    horizontalLayout?: "default" | "fitted" | "fitted";
    verticalLayout?: string;
  }
  interface Figlet {
    (word: string, callback: (err: Error, data: string) => void): void;
    textSync: (word: string, options?: FigletOpt) => string;
    text: (word: string, options: FigletOpt, callback: (err: Error, data: string) => void) => void;
  }
  export const figlet: Figlet;

  //  default figlet;
}
