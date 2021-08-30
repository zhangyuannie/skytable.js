export class NotImplementedError extends Error {
  override readonly name = "NotImplementedError";
  constructor(message: string) {
    super(message);
  }
}

export class SkyhashError extends Error {
  override readonly name = "SkyhashError";
  readonly code: number;
  constructor(code: number) {
    super();
    this.code = code;
  }
}
