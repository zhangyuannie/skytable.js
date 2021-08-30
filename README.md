# skytable.js

Node.js driver for [Skytable](https://github.com/skytable/skytable). WIP

- Support TypeScript out of the box
- Fully promise based API

## Installation

Make sure to have Skytable >= 0.7 and Node.js >= 12 installed.

```
$ npm install skytable
```

## Basic usage

```js
import { Skytable } from "skytable";
const skytable = new Skytable();

skytable.set("foo", "bar");
```
