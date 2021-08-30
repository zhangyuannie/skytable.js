import { createAction, createQuery } from "./query";

describe("createAction", () => {
  test("should work with set", () => {
    const ret = createAction(["SET", "x", "ex"]);
    expect(ret).toBe("~3\n3\nSET\n1\nx\n2\nex\n");
  });
});

describe("createQuery", () => {
  test("should work with simple set query", () => {
    const query = createQuery([createAction(["SET", "x", "ex"])]);
    expect(query).toBe("*1\n~3\n3\nSET\n1\nx\n2\nex\n");
  });
});
