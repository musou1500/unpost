import * as fsp from "node:fs/promises";
import * as path from "node:path";
import * as s from "~/board";

export class DB {
  constructor(private dataDir: string) {}

  async addAction(boardId: string, action: s.Actions): Promise<void> {
    const filePath = this.getDataFilePath(boardId);
    const data = JSON.stringify(action) + "\n";
    await fsp.appendFile(filePath, data);
  }

  async getActions(boardId: string): Promise<s.Actions[]> {
    const filePath = this.getDataFilePath(boardId);
    try {
      const data = await fsp.readFile(filePath, "utf-8");
      return data
        .trim()
        .split("\n")
        .filter((line) => line.length > 0)
        .map((line) => JSON.parse(line));
    } catch (e) {
      if (e instanceof Error && "code" in e && e.code === "ENOENT") {
        return [];
      }
      throw e;
    }
  }

  private getDataFilePath(boardId: string): string {
    return path.join(this.dataDir, `${boardId}.jsonl`);
  }
}

export const db = new DB(path.join(process.cwd(), "data"));
