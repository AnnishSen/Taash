

import { WebSocket } from "ws";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { addSocket } from "./socketManager.js";
import { setSocketUser } from "./socketManager.js";


interface AuthMessage{
    type:"auth";
    token: String;
}

export const authenticate = async (
    ws: WebSocket,
    data: any
) => {
    const authPromise = (async () => {
        try{

            const decoded = jwt.verify(
                data.token,
                process.env.JWT_SECRET!
            ) as {
                userId:string;
                email:string;
            };

        const user = await prisma.user.findUnique({
            where:{
                id:decoded.userId,
            },
        });

        if(!user){
            ws.send(
                JSON.stringify({
                    type:"error",
                    message:"User not found",
                })
            );
            ws.close();

            return;
        }


        addSocket(user.id,ws);
        setSocketUser(ws, user.id);

        // Mark user as online in database
        await prisma.user.update({
            where: { id: user.id },
            data: { isOnline: true },
        });

        console.log(`${user.username} authenticated`);

        ws.send(
            JSON.stringify({
                type:"authenticated",
                message:"Authentication successful",
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
            })
        );

        }catch{

                ws.send(
                JSON.stringify({
                    type: "error",
                    message: "Invalid token",
                })
            );

            ws.close();

        }
    })();

    (ws as any)._authPromise = authPromise;
    await authPromise;
};