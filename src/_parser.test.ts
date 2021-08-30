import { BufferParser } from "./_parser";

describe("BufferParser", () => {
  test("should parse simple response code in single buffer", async () => {
    const parser = new BufferParser();
    const res = parser.getResponse();
    parser.push(new TextEncoder().encode("*1\n!1\n0\n"));
    const rcode = await res;
    expect(rcode).toEqual({ kind: "response_code", code: 0 });
  });

  test("should parse simple response code in multiple buffers", async () => {
    const parser = new BufferParser();
    const res = parser.getResponse();
    parser.push(new TextEncoder().encode("*1"));
    parser.push(new TextEncoder().encode("\n!1\n0"));
    parser.push(new TextEncoder().encode("\n"));
    const rcode = await res;
    expect(rcode).toEqual({ kind: "response_code", code: 0 });
  });
});
