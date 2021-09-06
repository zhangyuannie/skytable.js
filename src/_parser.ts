import { Uint8Deque } from "typeddeque";
import { NotImplementedError, ProtocolError } from "./errors";
import {
  createInt,
  createResponseCode,
  createString,
  createStringArray,
  SkyhashElement,
} from "./skyhash_types";
import { decoder } from "./_util";

const newline = "\n".charCodeAt(0);
const star = "*".charCodeAt(0);

const codeSymbol = "!".charCodeAt(0);
const stringSymbol = "+".charCodeAt(0);
const intSymbol = ":".charCodeAt(0);
const binarySymbol = "?".charCodeAt(0);
const typedArraySymbol = "@".charCodeAt(0);

export class BufferParser {
  #buffer = new Uint8Deque();
  #messages: SkyhashElement[] = [];
  #queue: ((e: SkyhashElement) => void)[] = [];
  #offset = 0;

  push(data: Uint8Array): void {
    this.#buffer.push(data);
    this.parseBuffer();
  }

  parseBuffer(): void {
    while (this.#messages.length && this.#queue.length) {
      this.#queue.shift()!(this.#messages.shift()!);
    }

    // metaframe requires at least 3 bytes + 1 byte for the content
    if (this.#buffer.length < 5) return;
    this.#offset = 0;
    if (this.#buffer.at(0) !== star) {
      throw new ProtocolError("metaframe does not start with '*'");
    }
    this.#offset++;

    const c = this._parseLength();
    if (c == null) return;
    if (c !== 1) throw new NotImplementedError("Batch query");

    const elem = this._parseElement();
    if (elem == null) return;
    this.#buffer.shift(this.#offset);

    if (this.#queue.length) {
      this.#queue.shift()!(elem);
    } else {
      this.#messages.push(elem);
    }
  }

  getResponse(): Promise<SkyhashElement> {
    if (this.#messages.length) {
      return Promise.resolve(this.#messages.shift()!);
    }
    return new Promise((resolve, _) => {
      this.#queue.push(resolve);
    });
  }

  private _parseElement(): SkyhashElement | null {
    const tsymbol = this.#buffer.at(this.#offset);
    this.#offset++;

    switch (tsymbol) {
      case codeSymbol: {
        const code = this._parseString();
        if (code == null) return null;
        return createResponseCode(decoder.decode(code));
      }
      case binarySymbol:
      case stringSymbol: {
        const value = this._parseString();
        if (value == null) return null;
        return createString(value);
      }
      case intSymbol: {
        const value = this._parseString();
        if (value == null) return null;
        return createInt(decoder.decode(value));
      }
      case typedArraySymbol: {
        const subT = this.#buffer.at(this.#offset);
        this.#offset++;
        if (subT !== stringSymbol && subT !== binarySymbol) {
          throw new NotImplementedError(`Typed array of '${subT}'`);
        }
        const arr = this._parseStringArray();
        if (arr == null) return null;
        return createStringArray(arr);
      }
      default:
        throw new NotImplementedError(`tsymbol '${tsymbol}'`);
    }
  }

  /** parse `3\n1\na\n1\nb\n\0\n` and return `[a, b, null]` */
  private _parseStringArray(): (Uint8Array | null)[] | null {
    const length = this._parseLength();
    if (length == null) return null;

    const ret = new Array(length);
    for (let i = 0; i < length; i++) {
      const peek = this.#buffer.at(this.#offset);
      if (peek === 0) {
        this.#offset += 2;
        ret[i] = null;
      } else {
        const elem = this._parseString();
        if (elem == null) return null;
        ret[i] = elem;
      }
    }

    return ret;
  }

  /** parse `3\nabc\n` and return `abc` */
  private _parseString(): Uint8Array | null {
    const length = this._parseLength();
    if (length == null) return null;
    if (this.#offset + length > this.#buffer.length) {
      return null;
    }
    const ret = this.#buffer.slice(this.#offset, this.#offset + length);

    this.#offset += length + 1;
    return ret;
  }

  /** parse `3\n` and return `3` */
  private _parseLength(): number | null {
    const idx = this.#buffer.indexOf(newline, this.#offset);
    if (idx < 0) return null;

    const ret = +decoder.decode(this.#buffer.slice(this.#offset, idx));

    if (!Number.isInteger(ret)) {
      throw new ProtocolError("length is not an integer");
    }

    this.#offset = idx + 1;
    return ret;
  }
}
