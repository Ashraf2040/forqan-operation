declare module "ssh2-sftp-client" {
  import type { Readable } from "node:stream";

  interface SftpConfig {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
    readyTimeout?: number;
  }

  class SftpClient {
    connect(config: SftpConfig): Promise<void>;
    mkdir(path: string, recursive?: boolean): Promise<string>;
    put(input: Buffer | Readable | string, remotePath: string): Promise<string>;
    get(remotePath: string): Promise<Buffer>;
    delete(remotePath: string): Promise<void>;
    end(): Promise<void>;
  }

  export default SftpClient;
}
