import fs from 'fs';
import path from 'path';
import { format, writeToPath } from '@fast-csv/format';
import { parse } from '@fast-csv/parse';

type Stringify<T> = {
  [key in keyof T]: string;
};

type Textify<T> = {
  [key in keyof T]: string | number;
};

export async function exists(filePath: string) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function mkdir(path: string) {
  try {
    await fs.promises.mkdir(path, { recursive: true });
  } catch {}
}

export async function rmFile(path: string) {
  try {
    await fs.promises.rm(path);
  } catch {}
}

export interface IStorage<P> {
  read(): Promise<P | null>;
  write(item: P): Promise<void>;
}

export interface IListStorage<P> {
  append(row: P | P[]): Promise<void>;
}

export abstract class BaseFileStorage<P> implements IStorage<P> {
  protected constructor(public folderPath: string, public fileName: string) {}

  public async delete(): Promise<void> {
    await rmFile(this.filePath);
  }

  public async exists(filePath: string = this.filePath) {
    return await exists(filePath);
  }

  protected async createFolder() {
    await fs.promises.mkdir(this.folderPath, { recursive: true });
  }

  protected get filePath() {
    return path.resolve(this.folderPath, this.fileName);
  }

  abstract read(): Promise<P | null>;
  abstract write(item: P): Promise<void>;
}

export abstract class BaseListFileStorage<P>
  extends BaseFileStorage<P[]>
  implements IListStorage<P>
{
  public abstract append(row: P | P[]): Promise<void>;
}

export class JsonStorage<P extends object> extends BaseFileStorage<P> {
  constructor(public folderPath: string, public fileName: string) {
    super(folderPath, fileName);
  }

  async write(data: P): Promise<void> {
    await this.createFolder();
    const str = JSON.stringify(data);
    await fs.promises.writeFile(this.filePath, str, { encoding: 'utf-8' });
  }

  async read(): Promise<P | null> {
    if (!(await exists(this.filePath))) {
      return null;
    }

    const str = await fs.promises.readFile(this.filePath, {
      encoding: 'utf-8',
    });
    return JSON.parse(str);
  }
}

export class CsvStorage<P extends object> extends BaseListFileStorage<P> {
  constructor(
    public readonly folderPath: string,
    public readonly fileName: string,
    protected readonly onRead: (row: Stringify<P>) => P,
    protected readonly onWrite: (row: P) => Textify<P>,
  ) {
    super(folderPath, fileName);
  }

  public async read(): Promise<P[] | null> {
    if (!(await this.exists(this.filePath))) {
      return null;
    }

    return new Promise((res, rej) => {
      const data: P[] = [];

      const readStream = fs.createReadStream(this.filePath, {
        encoding: 'utf-8',
      });
      const csvStream = parse({ headers: true })
        .on('data', (row) => {
          data.push(this.onRead(row));
        })
        .on('end', () => res(data))
        .on('error', rej);

      readStream.pipe(csvStream);
    });
  }

  public async write(rows: P[]): Promise<void> {
    return new Promise(async (res, rej) => {
      await this.createFolder();

      if (await this.exists()) {
        await this.delete();
      }

      const writeStream = writeToPath(this.filePath, rows, {
        headers: true,
        includeEndRowDelimiter: true,
        transform: this.onWrite,
      });

      writeStream.on('finish', res);
      writeStream.on('error', rej);
    });
  }

  public async append(row: P | P[]): Promise<void> {
    const rows = Array.isArray(row) ? row : [row];

    return new Promise(async (res, rej) => {
      await this.createFolder();

      const fileExists = await this.exists();

      const writeStream = fs.createWriteStream(this.filePath, {
        encoding: 'utf-8',
        flags: 'a',
      });
      const csvStream = format({
        headers: !fileExists,
        includeEndRowDelimiter: true,
      });
      csvStream.pipe(writeStream);

      rows.forEach((row) => csvStream.write(this.onWrite(row)));

      writeStream.on('finish', res);
      writeStream.on('error', rej);

      csvStream.end();
    });
  }
}

export class InMemoryStorage<P extends object> implements IStorage<P> {
  private value: P | null = null;

  async read(): Promise<P | null> {
    return this.value;
  }

  async write(item: P): Promise<void> {
    this.value = item;
  }
}

export class InMemoryListStorage<P extends object> implements IListStorage<P> {
  private list = new Set<P>();

  async read(): Promise<P[] | null> {
    return this.list.size === 0 ? null : Array.from(this.list);
  }

  async write(item: P[]): Promise<void> {
    this.list = new Set(item);
  }

  async append(row: P[] | P): Promise<void> {
    const rows = Array.isArray(row) ? row : [row];
    rows.forEach((row) => this.list.add(row));
  }
}
