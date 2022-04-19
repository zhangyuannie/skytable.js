import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { mkdirSync } from "fs";

import { connect, Skytable } from "../..";

const skydDir = "/tmp/skytable.test.js";

describe("Integration", () => {
  let skyd: ChildProcessWithoutNullStreams;
  let skytable: Skytable;
  beforeAll((done) => {
    mkdirSync(skydDir, { recursive: true });
    skyd = spawn("skyd", ["--noart"], { cwd: skydDir });
    skyd.stderr.on("data", (data) => {
      const s = new TextDecoder().decode(data).toLowerCase();
      if (s.includes("server started")) {
        skyd.stdout.removeAllListeners("data");
        done();
      }
    });
  });

  afterAll(() => {
    expect(skyd.kill()).toBe(true);
  });

  beforeEach(async () => {
    skytable = await connect();
  });

  test("heya", async () => {
    expect(await skytable.heya()).toBe("HEY!");
    expect(await skytable.heya("hi")).toBe("hi");
  });
});
