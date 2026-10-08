
import type  { Request, Response } from "express";
import {z} from "zod";
import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const signup = async (req:Request, res:Response) => {

         // input
         const {email,username,password}= req.body;

         // validate the input 
         if (!email || !username || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

   // Username length
  if (username.length < 3) {
    return res.status(400).json({
      message: "Username must be at least 3 characters",
    });
  }

  // Password length
  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters",
    });
  }

  // Email format
  if (!email.includes("@")) {
    return res.status(400).json({
      message: "Invalid email",
    });
  }
         // check  if alreasy present or not
           const existingUser=await prisma.user.findUnique({
            where: {
              email:email,
            }
           })

           if(existingUser){
            return res.status(409).json({
              success:  false,
              message:"User already exist",
            })
           }
      // password hashing
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password,salt);

         // add to the database

         await prisma.user.create({
          data: {
            username,
            email,
            password:hashedPassword,
            isOnline:false,
          },
         });

         return res.status(201).json({
    success: true,
    message: "User created successfully",
});




      
};


export const signin = async (req:Request, res:Response) => {

  // get input
  const {email,password}= req.body;

  const existingUser= await prisma.user.findUnique({
    where:{
      email:email,
    }
  })

  // check if user exixt or not 
  if(!existingUser){
   return  res.status(401).json({
      success:false,
      mesage:"user do not exixt",
    })
  }

  // compare input pasword and original password
const isPasswordCorrect = await bcrypt.compare(
  password,
  existingUser.password);

if(!isPasswordCorrect){
  return res.status(401).json({
         success:false,
         message:"Invalid email or pasword",
  })
}
// generate token
const token = jwt.sign(
  {
    userId:existingUser.id,
    email:existingUser.email,
  },
  process.env.JWT_SECRET!,
  {
    expiresIn:"7d",
  }
);



// return token + user info
return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
    },
});

};



export const getMe = async (
  req:Request, 
  res:Response
) => {
   

  const userId = req.user!.userId ;

    const user = await prisma.user.findUnique({
    where: {
        id: userId,
    },
    select: {
        id: true,
        username: true,
        email: true,
        isOnline: true,
    },
});
    if(!user){
      return res.status(400).json({
        success:false,
        message:"User not found",
      })
    }

    

    const activeRoomPlayer = await prisma.roomPlayer.findFirst({
        where: {
            userId,
            room: { status: { in: ["WAITING", "PLAYING"] } },
        },
        include: {
            room: true,
        },
    });

    return res.status(200).json({
        success: true,
        message: "User Profile",
        user,
        currentRoomCode: activeRoomPlayer?.room.roomCode || null,
    });

};

export const logout = async (
  req:Request,
  res:Response
) => {

  const userId = req.user!.userId;
 
   await prisma.user.update({
    where: {
        id:userId,
    },
    data: {
        isOnline:false,
    },
});


return res.status(200).json({
    success: true,
    message: "Logged out successfully",
});

};