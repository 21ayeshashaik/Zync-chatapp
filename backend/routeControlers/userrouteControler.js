import User from "../Models/userModels.js";
import bcryptjs from 'bcryptjs'
import jwtToken from '../utils/jwtwebToken.js'

export const userRegister = async (req, res) => {
  try {
    const { fullname, username, email, gender, password, profilepic } = req.body;
    console.log(req.body);
    const user = await User.findOne({ username, email });
    if (user) return res.status(500).send({ success: false, message: " UserName or Email Alredy Exist " });
    const hashPassword = bcryptjs.hashSync(password, 10);
    const profileBoy = profilepic || `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const profileGirl = profilepic || `https://avatar.iran.liara.run/public/girl?username=${username}`;

    const newUser = new User({
      fullname,
      username,
      email,
      password: hashPassword,
      gender,
      profilepic: gender === "male" ? profileBoy : profileGirl
    })

    if (newUser) {
      await newUser.save();
      jwtToken(newUser._id, res)
    } else {
      res.status(500).send({ success: false, message: "Inavlid User Data" })
    }

    res.status(201).send({
      _id: newUser._id,
      fullname: newUser.fullname,
      username: newUser.username,
      profilepic: newUser.profilepic,
      email: newUser.email,
    })
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error
    })
    console.log(error);
  }
}

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email })
    if (!user) return res.status(500).send({ success: false, message: "Email Dosen't Exist Register" })
    const comparePasss = bcryptjs.compareSync(password, user.password || "");
    if (!comparePasss) return res.status(500).send({ success: false, message: "Email Or Password dosen't Matching" })

    jwtToken(user._id, res);

    res.status(200).send({
      _id: user._id,
      fullname: user.fullname,
      username: user.username,
      profilepic: user.profilepic,
      email: user.email,
      message: "Succesfully LogIn"
    })

  } catch (error) {
    res.status(500).send({
      success: false,
      message: error
    })
    console.log(error);
  }
}


export const userLogOut = async (req, res) => {
  try {
    res.cookie("jwt", '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    });
    res.status(200).send({ success: true, message: "User LogOut" });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message
    });
    console.log(error);
  }
}

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    res.status(500).json({ error: "Failed to get current user" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullname, bio } = req.body;
    const userId = req.user._id;
    const file = req.file;

    const updateData = {};
    if (fullname) updateData.fullname = fullname;
    if (bio) updateData.bio = bio;

    if (file) {
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/images/${file.filename}`;
      updateData.profilepic = fileUrl;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile", details: error.message });
  }
};


