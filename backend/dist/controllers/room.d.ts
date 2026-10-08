import type { Request, Response } from "express";
export declare const createRoom: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const joinRoom: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const leaveRoom: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getRoom: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const toggleReady: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const startGame: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getRooms: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const inviteToRoom: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=room.d.ts.map