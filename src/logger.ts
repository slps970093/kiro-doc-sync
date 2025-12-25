export class Logger {
  // ANSI 顏色代碼
  private static readonly COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
  };

  static info(message: string): void {
    console.log(`${this.COLORS.cyan}ℹ${this.COLORS.reset} ${message}`);
  }

  static success(message: string): void {
    console.log(`${this.COLORS.green}✓${this.COLORS.reset} ${message}`);
  }

  static warn(message: string): void {
    console.log(`${this.COLORS.yellow}⚠${this.COLORS.reset} ${message}`);
  }

  static error(message: string): void {
    console.log(`${this.COLORS.red}✗${this.COLORS.reset} ${message}`);
  }

  static skip(message: string): void {
    console.log(`${this.COLORS.gray}⊘${this.COLORS.reset} ${message}`);
  }

  static section(title: string): void {
    const line = '='.repeat(50);
    console.log(`\n${this.COLORS.blue}${line}${this.COLORS.reset}`);
    console.log(`${this.COLORS.blue}${title}${this.COLORS.reset}`);
    console.log(`${this.COLORS.blue}${line}${this.COLORS.reset}\n`);
  }

  static summary(title: string, items: string[]): void {
    console.log(`\n${this.COLORS.cyan}${title}:${this.COLORS.reset}`);
    items.forEach(item => {
      console.log(`  ${item}`);
    });
  }

  static result(success: boolean, message: string): void {
    if (success) {
      this.success(message);
    } else {
      this.error(message);
    }
  }
}
