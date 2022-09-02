import type { Class } from 'type-fest';
import type { Model, ModelStatic } from '../model';
import type { Sequelize } from '../sequelize';
import type { Association } from './base';
export * from './base';
export * from './belongs-to';
export * from './has-one';
export * from './has-many';
export * from './belongs-to-many';
export declare type BeforeAssociateEventData = {
    source: ModelStatic<Model>;
    target: ModelStatic<Model>;
    sequelize: Sequelize;
    type: Class<Association>;
};
export declare type AfterAssociateEventData = BeforeAssociateEventData & {
    association: Association;
};
