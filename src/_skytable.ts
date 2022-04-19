import { createAction, createQuery, Query } from "./query";
import type { Socket } from "net";
import { BufferParser } from "./_parser";
import { NotImplementedError, ProtocolError, SkyhashError } from "./errors";
import { ResponseCodeNumber } from "./skyhash_types";
import { decoder, Integer } from "./_util";

export class Skytable {
  #conn: Socket;
  #parser = new BufferParser();

  constructor(conn: Socket) {
    this.#conn = conn;
    this.#conn.on("data", (data) => {
      this.#parser.push(data);
    });
  }

  /**
   * Closes the underlying tcp connection. If the connection is already closed,
   * this method does nothing.
   */
  close(): void {
    this.#conn.end();
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

  async dbsize(entity?: string): Promise<Integer> {
    const action = createAction(
      entity == null ? ["DBSIZE"] : ["DBSIZE", entity]
    );
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "int":
        return elem.value;
      default:
        throw new ProtocolError("bad data type");
    }
  }

  async del(...keys: string[]): Promise<Integer> {
    const action = createAction(["DEL", ...keys]);
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "int":
        return elem.value;
      default:
        throw new ProtocolError("bad data type");
    }
  }

  async exists(...keys: string[]): Promise<Integer> {
    const action = createAction(["EXISTS", ...keys]);
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "int":
        return elem.value;
      default:
        throw new ProtocolError("bad data type");
    }
  }

  async flushdb(entity?: string): Promise<void> {
    const action = createAction(
      entity == null ? ["FLUSHDB"] : ["FLUSHDB", entity]
    );
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "response_code":
        switch (elem.code) {
          case ResponseCodeNumber.Okay:
            return;
          default:
            throw new SkyhashError(elem.code);
        }
      default:
        throw new ProtocolError("bad data type");
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
        throw new ProtocolError("bad data type");
    }
  }

  async heya(message?: string): Promise<string> {
    const action = createQuery([
      createAction(message == null ? ["HEYA"] : ["HEYA", message]),
    ]);
    const elem = await this.query(action);
    switch (elem.kind) {
      case "string":
        return decoder.decode(elem.value);
      default:
        throw new ProtocolError("bad data type");
    }
  }

  async keylen(key: string): Promise<Integer | undefined> {
    const action = createAction(["KEYLEN", key]);
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "int":
        return elem.value;
      case "response_code":
        if (elem.code === ResponseCodeNumber.Nil) {
          return undefined;
        }
        throw new SkyhashError(elem.code);
      default:
        throw new ProtocolError("bad data type");
    }
  }

  async lskeys(limit: Integer): Promise<(string | null)[]>;
  async lskeys(entity: string): Promise<(string | null)[]>;
  async lskeys(entity: string, limit: Integer): Promise<(string | null)[]>;
  async lskeys(...args: (string | Integer)[]): Promise<(string | null)[]> {
    const action = createAction(["LSKEYS", ...args]);
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "string_array":
        return elem.value.map((buffer) =>
          buffer ? decoder.decode(buffer) : null
        );
      default:
        throw new ProtocolError("bad data type");
    }
  }

  async mget(...args: string[]): Promise<(string | null)[]> {
    const action = createAction(["MSET", ...args]);
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "string_array":
        return elem.value.map((buffer) =>
          buffer ? decoder.decode(buffer) : null
        );
      default:
        throw new ProtocolError("bad data type");
    }
  }

  async mksnap(snapname?: string): Promise<boolean> {
    const action = createAction(
      snapname == null ? ["MKSNAP"] : ["MKSNAP", snapname]
    );
    const query = createQuery([action]);
    const elem = await this.query(query);
    switch (elem.kind) {
      case "response_code":
        return elem.code === 0;
      default:
        return false;
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
        throw new ProtocolError("bad data type");
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
        throw new ProtocolError("bad data type");
    }
  }

  async uset(pairs: [key: string, value: string][]): Promise<Integer>;
  async uset(key: string, value: string): Promise<Integer>;
  async uset(
    a: [key: string, value: string][] | string,
    b?: string
  ): Promise<Integer> {
    const action = b
      ? createAction(["USET", a as string, b])
      : createAction(["USET", ...(a as [key: string, value: string][]).flat()]);
    const query = createQuery([action]);
    const elem = await this.query(query);

    switch (elem.kind) {
      case "int":
        return elem.value;
      default:
        throw new ProtocolError("bad data type");
    }
  }
}
