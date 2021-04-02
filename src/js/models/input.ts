import { Point } from "./base";

export class Keys {
    constructor(
        public up = false,
        public down = false,
        public right = false,
        public left = false,
    ) { }
}

export class Mouse {
    constructor(
        public down = false,
        public point = new Point(undefined, undefined)
    ) { }
}