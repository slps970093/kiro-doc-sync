import * as readline from 'readline';

export class Prompt {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.rl.question(`${message} (y/n): `, (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  async choose(message: string, options: string[]): Promise<number> {
    return new Promise((resolve) => {
      console.log(message);
      options.forEach((opt, idx) => {
        console.log(`  ${idx + 1}. ${opt}`);
      });

      this.rl.question('Choose option (number): ', (answer) => {
        const choice = parseInt(answer, 10) - 1;
        resolve(Math.max(0, Math.min(choice, options.length - 1)));
      });
    });
  }

  close(): void {
    this.rl.close();
  }
}
