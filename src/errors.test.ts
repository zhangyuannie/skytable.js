import { NotImplementedError, SkyhashError } from "./errors";

describe("NotImplementedError", () => {
  test("should build", () => {
    const err = new NotImplementedError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(NotImplementedError);
    expect(err.name).toBe("NotImplementedError");
    expect(err.message).toBe("test");
  });
});

describe("SkyhashError", () => {
  test("should build", () => {
    const err = new SkyhashError(3);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(SkyhashError);
    expect(err.name).toBe("SkyhashError");
    expect(err.message).toBe("");
  });
});
