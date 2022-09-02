import type { Nullish } from '../utils/index.js';
export interface SequelizeErrorOptions {
    stack?: Nullish<string>;
}
export interface CommonErrorProperties {
    /** The SQL that triggered the error */
    readonly sql: string;
}
export declare type ErrorOptions = {
    cause?: Nullish<Error>;
};
/**
 * The Base Error all Sequelize Errors inherit from.
 *
 * Sequelize provides a host of custom error classes, to allow you to do easier debugging. All of these errors are exposed on the sequelize object and the sequelize constructor.
 * All sequelize errors inherit from the base JS error object.
 *
 * This means that errors can be accessed using `Sequelize.ValidationError`
 */
declare abstract class BaseError extends Error {
    cause?: Error;
    get parent(): this['cause'];
    get original(): this['cause'];
    constructor(message?: string, options?: ErrorOptions);
}
export default BaseError;
