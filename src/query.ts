import { encoder } from "./_util";

export type Action = AnyArray;
export type Query = AnyArray;

export function createAction(arr: (string | number)[]): Action {
  return createAnyArray(arr);
}

export function createQuery(actions: Action[]): Query {
  const head = `*${actions.length}\n`;
  let size = 0;
  for (const action of actions) {
    size += action.byteLength;
  }
  const ret = new Uint8Array(head.length + size);
  encoder.encodeInto(head, ret);
  let idx = head.length;
  for (const action of actions) {
    ret.set(action, idx);
    idx += action.byteLength;
  }
  return ret;
}

const newline = "\n".charCodeAt(0);

export type AnyArray = Uint8Array;

/** @see https://docs.skytable.io/next/protocol/data-types/#any-array */
export function createAnyArray(arr: (string | number)[]): AnyArray {
  let size = 0;
  const bufs = arr.map((elem) => {
    const buf = encoder.encode("" + elem);
    size += buf.byteLength + buf.byteLength.toString().length + 2;
    return buf;
  });

  const head = `~${arr.length}\n`;
  let ret = new Uint8Array(size + head.length);
  encoder.encodeInto(head, ret);
  let idx = head.length;

  for (const buf of bufs) {
    const len = `${buf.byteLength}\n`;
    encoder.encodeInto(len, ret.subarray(idx));
    idx += len.length;
    ret.set(buf, idx);
    idx += buf.byteLength;
    ret[idx] = newline;
    idx += 1;
  }

  return ret;
}
