import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models.js';
export type * from './prismaNamespace.js';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.objectEnumValues.instances.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.objectEnumValues.instances.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.objectEnumValues.instances.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: {
    "__#private@#private": any;
    _getNamespace(): string;
    _getName(): string;
    toString(): string;
};
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: {
    "__#private@#private": any;
    _getNamespace(): string;
    _getName(): string;
    toString(): string;
};
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: {
    "__#private@#private": any;
    _getNamespace(): string;
    _getName(): string;
    toString(): string;
};
export declare const ModelName: {
    readonly User: "User";
    readonly FriendRequest: "FriendRequest";
    readonly Friendship: "Friendship";
    readonly Room: "Room";
    readonly RoomPlayer: "RoomPlayer";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly username: "username";
    readonly email: "email";
    readonly password: "password";
    readonly isOnline: "isOnline";
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const FriendRequestScalarFieldEnum: {
    readonly id: "id";
    readonly senderId: "senderId";
    readonly receiverId: "receiverId";
    readonly status: "status";
};
export type FriendRequestScalarFieldEnum = (typeof FriendRequestScalarFieldEnum)[keyof typeof FriendRequestScalarFieldEnum];
export declare const FriendshipScalarFieldEnum: {
    readonly id: "id";
    readonly user1Id: "user1Id";
    readonly user2Id: "user2Id";
};
export type FriendshipScalarFieldEnum = (typeof FriendshipScalarFieldEnum)[keyof typeof FriendshipScalarFieldEnum];
export declare const RoomScalarFieldEnum: {
    readonly id: "id";
    readonly roomCode: "roomCode";
    readonly hostId: "hostId";
    readonly status: "status";
};
export type RoomScalarFieldEnum = (typeof RoomScalarFieldEnum)[keyof typeof RoomScalarFieldEnum];
export declare const RoomPlayerScalarFieldEnum: {
    readonly id: "id";
    readonly roomId: "roomId";
    readonly userId: "userId";
    readonly seat: "seat";
    readonly isReady: "isReady";
};
export type RoomPlayerScalarFieldEnum = (typeof RoomPlayerScalarFieldEnum)[keyof typeof RoomPlayerScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map