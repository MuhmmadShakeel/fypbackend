import Profile from "../model/ProfileModel.js";
import cloudinary from "../config/Cloudinary.js";

const uploadBufferToCloudinary = async (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

export const createProfile = async (req, res) => {
  try {
    const { bio } = req.body;
    const userId = req.userId;
    let profilePicture = null;

    if (req.file?.buffer) {
      try {
        const uploadedImage = await uploadBufferToCloudinary(
          req.file.buffer,
          "Profile_Pictures"
        );

        profilePicture = {
          public_id: uploadedImage.public_id,
          url: uploadedImage.secure_url,
        };
      } catch (uploadError) {
        console.error("Cloudinary Upload Error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile picture",
        });
      }
    }

    const newProfile = new Profile({
      user: userId,
      bio: bio?.trim(),
      profilePicture,
    });

    const savedProfile = await newProfile.save();

    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: savedProfile,
    });
  } catch (error) {
    console.error("Create Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProfilebyId = async (req, res) => {
  try {
    const existingProfile = await Profile.findOne({ user: req.userId }).populate(
      "user",
      "name email"
    );

    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: existingProfile,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updatePrfile = async (req, res) => {
  try {

    const { bio } = req.body;

    // Get logged in user id
    const userId = req.userId;

    // Find existing profile
    const existingProfile = await Profile.findOne({ user: userId });

    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Default existing image
    let profilePicture = existingProfile.profilePicture;

    // Upload new image if provided
    if (req.file?.buffer) {
      try {
        if (existingProfile.profilePicture?.public_id) {
          await cloudinary.uploader.destroy(
            existingProfile.profilePicture.public_id
          );
        }

        const uploadedImage = await uploadBufferToCloudinary(
          req.file.buffer,
          "Profile_Pictures"
        );

        profilePicture = {
          public_id: uploadedImage.public_id,
          url: uploadedImage.secure_url,
        };
      } catch (uploadError) {
        console.error("Cloudinary Upload Error:", uploadError);

        return res.status(500).json({
          success: false,
          message: "Failed to upload profile picture",
        });
      }
    }

    // Update profile
    const updatedProfile = await Profile.findOneAndUpdate(
      { user: userId },
      {
        bio: bio?.trim() || existingProfile.bio,
        profilePicture,
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile,
    });

  } catch (error) {

    console.error("Update Profile Error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const existingProfile = await Profile.findOneAndDelete({ user: userId });

    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.error("Delete Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



    