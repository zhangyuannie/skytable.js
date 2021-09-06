export type Action = string;
export type Query = string;

/**
 * @see https://docs.skytable.io/next/protocol/data-types/#any-array
 */
export function createAction(
  arr: (string | number | undefined | null)[],
): Action {
  return `~${arr.length}\n${arr
    .map((elem) => {
      if (elem == null) return "";
      const s = "" + elem;
      return `${s.length}\n${s}\n`;
    })
    .join("")}`;
}

export function createQuery(actions: Action[]): Query {
  return `*${actions.length}\n${actions.join("")}`;
}
