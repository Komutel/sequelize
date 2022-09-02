import ConnectionError from '../connection-error';
/**
 * Thrown when a connection to a database is refused
 */
declare class ConnectionRefusedError extends ConnectionError {
    constructor(cause: Error);
}
export default ConnectionRefusedError;
