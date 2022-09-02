import type { ErrorOptions } from './base-error';
import BaseError from './base-error';
/**
 * Thrown when an include statement is improperly constructed (see message for details)
 */
declare class EagerLoadingError extends BaseError {
    constructor(message: string, options?: ErrorOptions);
}
export default EagerLoadingError;
