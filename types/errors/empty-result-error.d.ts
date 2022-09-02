import type { ErrorOptions } from './base-error';
import BaseError from './base-error';
/**
 * Thrown when a record was not found, Usually used with rejectOnEmpty mode (see message for details)
 */
declare class EmptyResultError extends BaseError {
    constructor(message: string, options?: ErrorOptions);
}
export default EmptyResultError;
