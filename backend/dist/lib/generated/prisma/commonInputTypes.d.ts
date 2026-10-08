import * as $Enums from "./enums.js";
import type * as Prisma from "./internal/prismaNamespace.js";
export type StringFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedStringFilter<$PrismaModel> | string;
};
export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolFilter<$PrismaModel> | boolean;
};
export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedStringFilter<$PrismaModel>;
    _max?: Prisma.NestedStringFilter<$PrismaModel>;
};
export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedBoolFilter<$PrismaModel>;
    _max?: Prisma.NestedBoolFilter<$PrismaModel>;
};
export type EnumFriendRequestStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.FriendRequestStatus | Prisma.EnumFriendRequestStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.FriendRequestStatus[] | Prisma.ListEnumFriendRequestStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FriendRequestStatus[] | Prisma.ListEnumFriendRequestStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFriendRequestStatusFilter<$PrismaModel> | $Enums.FriendRequestStatus;
};
export type EnumFriendRequestStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FriendRequestStatus | Prisma.EnumFriendRequestStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.FriendRequestStatus[] | Prisma.ListEnumFriendRequestStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FriendRequestStatus[] | Prisma.ListEnumFriendRequestStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFriendRequestStatusWithAggregatesFilter<$PrismaModel> | $Enums.FriendRequestStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumFriendRequestStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumFriendRequestStatusFilter<$PrismaModel>;
};
export type EnumRoomStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RoomStatus | Prisma.EnumRoomStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.RoomStatus[] | Prisma.ListEnumRoomStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.RoomStatus[] | Prisma.ListEnumRoomStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumRoomStatusFilter<$PrismaModel> | $Enums.RoomStatus;
};
export type EnumRoomStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RoomStatus | Prisma.EnumRoomStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.RoomStatus[] | Prisma.ListEnumRoomStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.RoomStatus[] | Prisma.ListEnumRoomStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumRoomStatusWithAggregatesFilter<$PrismaModel> | $Enums.RoomStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumRoomStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumRoomStatusFilter<$PrismaModel>;
};
export type IntFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntFilter<$PrismaModel> | number;
};
export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatFilter<$PrismaModel>;
    _sum?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedIntFilter<$PrismaModel>;
    _max?: Prisma.NestedIntFilter<$PrismaModel>;
};
export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedStringFilter<$PrismaModel> | string;
};
export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolFilter<$PrismaModel> | boolean;
};
export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedStringFilter<$PrismaModel>;
    _max?: Prisma.NestedStringFilter<$PrismaModel>;
};
export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntFilter<$PrismaModel> | number;
};
export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedBoolFilter<$PrismaModel>;
    _max?: Prisma.NestedBoolFilter<$PrismaModel>;
};
export type NestedEnumFriendRequestStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.FriendRequestStatus | Prisma.EnumFriendRequestStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.FriendRequestStatus[] | Prisma.ListEnumFriendRequestStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FriendRequestStatus[] | Prisma.ListEnumFriendRequestStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFriendRequestStatusFilter<$PrismaModel> | $Enums.FriendRequestStatus;
};
export type NestedEnumFriendRequestStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FriendRequestStatus | Prisma.EnumFriendRequestStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.FriendRequestStatus[] | Prisma.ListEnumFriendRequestStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.FriendRequestStatus[] | Prisma.ListEnumFriendRequestStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumFriendRequestStatusWithAggregatesFilter<$PrismaModel> | $Enums.FriendRequestStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumFriendRequestStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumFriendRequestStatusFilter<$PrismaModel>;
};
export type NestedEnumRoomStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RoomStatus | Prisma.EnumRoomStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.RoomStatus[] | Prisma.ListEnumRoomStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.RoomStatus[] | Prisma.ListEnumRoomStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumRoomStatusFilter<$PrismaModel> | $Enums.RoomStatus;
};
export type NestedEnumRoomStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RoomStatus | Prisma.EnumRoomStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.RoomStatus[] | Prisma.ListEnumRoomStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.RoomStatus[] | Prisma.ListEnumRoomStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumRoomStatusWithAggregatesFilter<$PrismaModel> | $Enums.RoomStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumRoomStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumRoomStatusFilter<$PrismaModel>;
};
export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatFilter<$PrismaModel>;
    _sum?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedIntFilter<$PrismaModel>;
    _max?: Prisma.NestedIntFilter<$PrismaModel>;
};
export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedFloatFilter<$PrismaModel> | number;
};
//# sourceMappingURL=commonInputTypes.d.ts.map