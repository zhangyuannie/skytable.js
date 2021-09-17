# skytable.js

Node.js driver for [Skytable](https://github.com/skytable/skytable). WIP

- Support TypeScript out of the box
- Fully promise based API

## Installation

Make sure to have Skytable >= 0.7 and Node.js >= 14 installed.

```
$ npm install skytable.js
```

## Basic usage

```js
import { connect } from "skytable.js";
const skytable = await connect();

skytable.set("foo", "bar");
```
