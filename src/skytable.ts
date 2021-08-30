import { createAction, createQuery, Query } from "./query";
import { createConnection, Socket } from "net";
import { BufferParser } from "./_parser";
import { NotImplementedError, SkyhashError } from "./errors";
import { ResponseCodeNumber } from "./skyhash_types";
import { decoder } from "./_util";

export interface ConnectOptions {
  port?: number;
  hostname?: string;
}

export class Skytable {
  #conn: Socket;
  #parser = new BufferParser();

  constructor({ port = 2003, hostname = "127.0.0.1" }: ConnectOptions = {}) {
    this.#conn = createConnection({ port, host: hostname });
    this.#conn.on("data", (data) => {
      this.#parser.push(data);
    });
  }

  async query(query: Query) {
    await new Promise<void>((resolve, reject) => {
      this.#conn.write(query, (e) => {
        if (e) reject(new NotImplementedError("Socket write error handling"));
        resolve();
      });
    });
    return this.#parser.getResponse();
  }

  async dbsize(entity?: string): Promise<number> {
    const action = createAction(entity ? ["DBSIZE", entity] : ["DBSIZE"]);
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "int":
        return elem.value;
      default:
        throw new NotImplementedError("Bad data type received");
    }
  }

  async del(...keys: string[]): Promise<number> {
    const action = createAction(["DEL", ...keys]);
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "int":
        return elem.value;
      default:
        throw new NotImplementedError("Bad data type received");
    }
  }

  async flushdb(entity?: string): Promise<true> {
    const action = createAction(entity ? ["FLUSHDB", entity] : ["FLUSHDB"]);
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "response_code":
        switch (elem.code) {
          case ResponseCodeNumber.Okay:
            return true;
          default:
            throw new SkyhashError(elem.code);
        }
      default:
        throw new NotImplementedError("Bad data type received");
    }
  }

  async exists(...keys: string[]): Promise<number> {
    const action = createAction(["EXISTS", ...keys]);
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "int":
        return elem.value;
      default:
        throw new NotImplementedError("Bad data type received");
    }
  }

  async get(key: string): Promise<string | undefined> {
    const action = createAction(["GET", key]);
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "string":
        return decoder.decode(elem.value);
      case "response_code":
        if (elem.code === ResponseCodeNumber.Nil) {
          return undefined;
        }
        throw new SkyhashError(elem.code);
      default:
        throw new NotImplementedError("Bad data type received");
    }
  }

  async set(key: string, value: string): Promise<boolean> {
    const action = createAction(["SET", key, value]);
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "response_code":
        switch (elem.code) {
          case ResponseCodeNumber.Okay:
            return true;
          case ResponseCodeNumber.OverwriteError:
            return false;
          default:
            throw new SkyhashError(elem.code);
        }
      default:
        throw new NotImplementedError("Bad data type received");
    }
  }

  async update(key: string, value: string): Promise<boolean> {
    const action = createAction(["UPDATE", key, value]);
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "response_code":
        switch (elem.code) {
          case ResponseCodeNumber.Okay:
            return true;
          case ResponseCodeNumber.Nil:
            return false;
          default:
            throw new SkyhashError(elem.code);
        }
      default:
        throw new NotImplementedError("Bad data type received");
    }
  }

  async uset(pairs: [key: string, value: string][]): Promise<number>;
  async uset(key: string, value: string): Promise<number>;
  async uset(
    a: [key: string, value: string][] | string,
    b?: string,
  ): Promise<number> {
    const action = b
      ? createAction(["USET", a as string, b])
      : createAction(["USET", ...(a as [key: string, value: string][]).flat()]);
    const query = createQuery([action]);
    const elem = await this.query(query);

    switch (elem.kind) {
      case "int":
        return elem.value;
      default:
        throw new NotImplementedError("Bad data type received");
    }
  }
}