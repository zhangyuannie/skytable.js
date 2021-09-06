import { BufferParser } from "./_parser";

const encoder = new TextEncoder();

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
    parser.push(encoder.encode("*1"));
    parser.push(encoder.encode("\n!1\n0"));
    parser.push(encoder.encode("\n"));
    const rcode = await res;
    expect(rcode).toEqual({ kind: "response_code", code: 0 });
  });

  test("should parse typed array of string", async () => {
    const parser = new BufferParser();
    const res = parser.getResponse();
    parser.push(encoder.encode("*1\n@+3\n3\nomg\n\0\n8\nhappened\n"));
    const rcode = await res;
    expect(rcode).toEqual({
      kind: "string_array",
      value: [encoder.encode("omg"), null, encoder.encode("happened")],
    });
  });
});
