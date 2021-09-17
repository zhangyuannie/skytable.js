import { connect as connectTcpTls } from "tls";
import { connect as connectTcp } from "net";
import { readFileSync } from "fs";
import { Skytable } from "./_skytable";

export type { Skytable };

export interface ConnectOptions {
  /** The port to connect to. Defaults to `2003`. */
  port?: number | null;
  /**
   * A literal IP address or host name that can be resolved to an IP address.
   * Defaults to `127.0.0.1`
   */
  hostname?: string | null;
}

export interface ConnectTlsOptions extends ConnectOptions {
  /** Server certificate file path. Defaults to Mozilla's root certificates */
  certFile?: string | null;
}

export function connect(opt: ConnectOptions = {}): Promise<Skytable> {
  return new Promise((resolve) => {
    const conn = connectTcp(
      {
        port: opt.port ?? 2003,
        host: opt.hostname ?? "127.0.0.1",
      },
      () => {
        resolve(new Skytable(conn));
      },
    );
  });
}

export function connectTls(opt: ConnectTlsOptions = {}): Promise<Skytable> {
  return new Promise((resolve) => {
    const conn = connectTcpTls(
      {
        port: opt.port ?? 2003,
        host: opt.hostname ?? "127.0.0.1",
        ca: opt.certFile ? [readFileSync(opt.certFile)] : undefined,
      },
      () => {
        resolve(new Skytable(conn));
      },
    );
  });
}
