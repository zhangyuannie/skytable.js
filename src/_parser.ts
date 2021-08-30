import { Uint8Deque } from "typeddeque";
import { NotImplementedError } from "./errors";
import {
  createInt,
  createResponseCode,
  createString,
  SkyhashElement,
} from "./skyhash_types";
import { decoder } from "./_util";

const newline = "\n".charCodeAt(0);
const star = "*".charCodeAt(0);

const codeSymbol = "!".charCodeAt(0);
const stringSymbol = "+".charCodeAt(0);
const intSymbol = ":".charCodeAt(0);
const binarySymbol = "?".charCodeAt(0);

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
      throw new NotImplementedError("Bad packet handling");
    }
    this.#offset++;

    const c = this._parseNumber();
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

    const length = this._parseNumber();
    if (length == null) return null;

    switch (tsymbol) {
      case codeSymbol: {
        const code = this._parseString(length);
        if (code == null) return null;
        return createResponseCode(decoder.decode(code));
      }
      case binarySymbol:
      case stringSymbol: {
        const value = this._parseString(length);
        if (value == null) return null;
        return createString(value);
      }
      case intSymbol: {
        const value = this._parseString(length);
        if (value == null) return null;
        return createInt(decoder.decode(value));
      }
      default:
        throw new NotImplementedError(`tsymbol '${tsymbol}'`);
    }
  }

  private _parseString(length: number): Uint8Array | null {
    if (this.#offset + length > this.#buffer.length) {
      return null;
    }
    const ret = this.#buffer.slice(this.#offset, this.#offset + length);

    this.#offset += length + 1;
    return ret;
  }

  private _parseNumber(): number | null {
    const idx = this.#buffer.indexOf(newline, this.#offset);
    if (idx < 0) return null;

    const ret = +decoder.decode(this.#buffer.slice(this.#offset, idx));
    this.#offset = idx + 1;
    return ret;
  }
}
