import { createAction, createQuery } from "./query";

describe("createAction", () => {
  test("should work with set", () => {
    const ret = createAction(["SET", "x", "ex"]);
    const expected = new TextEncoder().encode("~3\n3\nSET\n1\nx\n2\nex\n");
    expect(ret).toEqual(expected);
  });

  test("should work with utf8", () => {
    const ret = createAction(["SET", "x", "😃"]);
    const expected = new TextEncoder().encode("~3\n3\nSET\n1\nx\n4\n😃\n");
    expect(ret).toEqual(expected);
  });
});

describe("createQuery", () => {
  test("should work with simple set query", () => {
    const query = createQuery([createAction(["SET", "x", "ex"])]);
    const expected = new TextEncoder().encode("*1\n~3\n3\nSET\n1\nx\n2\nex\n");
    expect(query).toEqual(expected);
  });
});
