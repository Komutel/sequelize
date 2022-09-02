import ConnectionError from '../connection-error';
/**
 * Thrown when a connection to a database is refused due to insufficient privileges
 */
declare class AccessDeniedError extends ConnectionError {
    constructor(cause: Error);
}
export default AccessDeniedError;
