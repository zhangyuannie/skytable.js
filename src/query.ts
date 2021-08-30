export type Action = string;
export type Query = string;

/**
 * @see https://docs.skytable.io/next/protocol/data-types/#any-array
 */
export function createAction(arr: (string | undefined | null)[]): Action {
  return `~${arr.length}\n${
    arr
      .map((s) => (s == null ? "\0\n" : `${s.length}\n${s}\n`))
      .join("")
  }`;
}

export function createQuery(actions: Action[]): Query {
  return `*${actions.length}\n${actions.join("")}`;
}
