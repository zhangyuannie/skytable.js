export enum ResponseCodeNumber {
  Okay = 0,
  Nil = 1,
  OverwriteError = 2,
  ActionError = 3,
  PacketError = 4,
  ServerError = 5,
  OtherError = 6,
  WrongtypeError = 7,
  UnknownDataType = 8,
  EncodingError = 9,
}

export interface SkyhashResponseCode {
  kind: "response_code";
  code: ResponseCodeNumber;
  message?: string;
}

export function createResponseCode(code: string): SkyhashResponseCode {
  const codeInt = +code;
  return {
    kind: "response_code",
    code: isNaN(codeInt) ? ResponseCodeNumber.OtherError : codeInt,
    message: isNaN(codeInt) ? code : undefined,
  };
}

export interface SkyhashString {
  kind: "string";
  value: Uint8Array;
}

export function createString(value: Uint8Array): SkyhashString {
  return { kind: "string", value };
}

export interface SkyhashInt {
  kind: "int";
  value: number;
}

export function createInt(value: string): SkyhashInt {
  return { kind: "int", value: +value };
}

export interface SkyhashStringArray {
  kind: "string_array";
  value: (Uint8Array | null)[];
}

export function createStringArray(
  value: (Uint8Array | null)[],
): SkyhashStringArray {
  return { kind: "string_array", value };
}

export type SkyhashElement =
  | SkyhashInt
  | SkyhashString
  | SkyhashResponseCode
  | SkyhashStringArray;
