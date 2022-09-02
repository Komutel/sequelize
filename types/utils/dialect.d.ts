export declare function now(dialect: string): Date;
export declare function toDefaultValue(value: unknown, dialect: string): unknown;
export declare const TICK_CHAR = "`";
export declare function addTicks(s: string, tickChar?: string): string;
export declare function removeTicks(s: string, tickChar?: string): string;
