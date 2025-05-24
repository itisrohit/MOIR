import { Request, Response } from "express";
import { User, UserStatus } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthRequest } from "../utils/types/auth.types";
import { broadcastUserStatus } from '../socket/service';

const generateAccessAndRefreshTokens = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  return { accessToken, refreshToken };
};

//  Register a new user
export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { username, email, password, name } = req.body;
    if (!username || !email || !password || !name) {
      throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ApiError(409, "User with email or username already exists");
    }
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      name,
      status: "online",
    });
    const createdUser = await User.findById(user._id).select("-password");
    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      createdUser._id as string
    );
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      // .cookie("accessToken", accessToken, {
      //   httpOnly: false,
      //   secure: false,
      //   sameSite: "none",
      //   maxAge: 15 * 60 * 1000,
      // })
      .status(201)
      .json(
        new ApiResponse(
          201,
          {
            sucess: true,
            user: {},
            accessToken,
          },
          "User registered successfully"
        )
      );
  }
);

//  Login a user
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id as string
  );
  user.status = UserStatus.ONLINE;
  await user.save({ validateBeforeSave: false });

  res
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    // .cookie("accessToken", accessToken, {
    //   httpOnly: false,
    //   secure: false,
    //   sameSite: "none",
    //   maxAge: 15 * 60 * 1000,
    // })
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          sucess: true,
          user: {},
          accessToken,
        },
        "User logged in successfully"
      )
    );
});

//  Logout a user
export const logoutUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    
    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }
    await User.findByIdAndUpdate(
      userId,
      {
        status: UserStatus.OFFLINE
      },
      { new: true }
    );
    res
      .clearCookie("accessToken", {
        httpOnly: false,
        secure: false,
        sameSite: "none"
      })
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none"
      })
      .status(200)
      .json(new ApiResponse(
        200,
        {},
        "User logged out successfully"
      ));
  }
);



// Get user profile
export const getUserProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(401, "Unauthorized access");
    }
    const user = await User.findById(userId).select("-password");

    res.status(200).json(
      new ApiResponse(
        200,
        {
          sucess: true,
          user,
        },
        "User profile fetched successfully"
      )
    );
  }
);



export const refreshAccessToken = asyncHandler(
  async (req: AuthRequest, res: Response) => {
      const userId = req.user?._id;
      if (!userId) {
        throw new ApiError(401, "Unauthorized access");
      };
      const user = await User.findById(userId).select("-password"); 
      if (!user) {
        throw new ApiError(404, "Invalid refresh token");
      }

      const accessToken = user.generateAccessToken();

      res.status(200).json(
        new ApiResponse(
          200,
          {
            success: true,
            accessToken
          },
          "Access token refreshed successfully"
        )
      );
   
  }
);


// Get all users
export const getAllUsers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?._id) {
      throw new ApiError(401, "Unauthorized access");
    }
    
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments();
    
    res.status(200).json(
      new ApiResponse(
        200,
        {
          success: true,
          users,
          pagination: {
            total: totalUsers,
          }
        },
        "Users fetched successfully"
      )
    );
  }
);


