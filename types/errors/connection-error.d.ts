import BaseError from './base-error';
/**
 * A base class for all connection related errors.
 *
 * The connection specific error which triggered this one is available as {@link Error.cause}
 */
declare class ConnectionError extends BaseError {
    constructor(parent?: Error);
}
export default ConnectionError;
