import type { SequelizeErrorOptions } from '../base-error';
import type { DatabaseErrorParent } from '../database-error';
import DatabaseError from '../database-error';
/**
 * Thrown when a database query times out because of a deadlock
 */
declare class TimeoutError extends DatabaseError {
    constructor(parent: DatabaseErrorParent, options?: SequelizeErrorOptions);
}
export default TimeoutError;
