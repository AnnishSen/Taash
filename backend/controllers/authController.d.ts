import type { Request, Response } from "express";
export declare const signup: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const signin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMe: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const logout: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=authController.d.ts.map