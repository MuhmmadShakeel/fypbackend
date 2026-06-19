import ClaimItem from "../model/ClaimItemModel.js";
import Found from "../model/FoundModel.js";
import User from "../model/UserModel.js";
import cloudinary from "../config/Cloudinary.js";
import dotenv from 'dotenv'
dotenv.config()
import nodemailer from "nodemailer";

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

export const claimItem = async (req, res) => {
  try {
    const userId=req.userId
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required",
      });
    }
    const { name, contact, details } = req.body;
    if (!name || !contact || !details) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const foundItem = await Found.findById(id).populate("userId", "email name");

    if (!foundItem) {
      return res.status(404).json({
        success: false,
        message: "Found item not found",
      });
    }

    if (!foundItem.userId) {
      return res.status(400).json({
        success: false,
        message: "Found item owner not found",
      });
    }

    const ownerEmail = foundItem.userId.email;

    if (!ownerEmail) {
      return res.status(400).json({
        success: false,
        message: "Owner email not found",
      });
    }

    let imageData = {
      url: "",
      public_id: "",
    };

    if (req.file?.buffer) {
      const uploadedImage = await uploadBufferToCloudinary(
        req.file.buffer,
        "claimItems"
      );

      imageData = {
        url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
      };
    }

    const newClaim = await ClaimItem.create({
      userId,
      foundItemId: id,
      name,
      contact,
      details,
      claimImage: imageData,
    });

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.USER_MAIL,
          pass: process.env.USER_PASS,
        },
      });

      let emailHtml = `
        <div style="font-family: Arial; padding:20px;">
          <h2>New Claim Request</h2>
          <p>A user has claimed your found item.</p>

          <h3>Claim Details</h3>
          <p><b>Name:</b> ${name}</p>
          <p><b>Contact:</b> ${contact}</p>
          <p><b>Details:</b> ${details}</p>
      `;

      if (imageData.url) {
        emailHtml += `
          <h3>Proof Image</h3>
          <img src="${imageData.url}" style="max-width: 300px; border-radius: 8px;" />   
        `;
      }

      emailHtml += `
          <h3>Item Info</h3>
          <p><b>Item:</b> ${foundItem.name}</p>
          <p><b>Location:</b> ${foundItem.location}</p>
        </div>
      `;

      const mailOptions = {
        from: `Lost and Found <${process.env.USER_MAIL}>`,
        to: ownerEmail,
        subject: "Someone Claimed Your Found Item",
        html: emailHtml,
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail the claim creation if email fails, but log it properly
    }

    return res.status(201).json({
      success: true,
      message: "Claim submitted successfully",
      newClaim,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getClaimInfo = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    const claimInfo = await ClaimItem.find({ userId })
      .populate('userId', 'name')
      .populate('foundItemId');
    return res.status(200).json({ success: true, claimInfo });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteClaim = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Claim ID is required" });
    }

    const claim = await ClaimItem.findById(id);
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    if (claim.claimImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(claim.claimImage.public_id);
      } catch (cloudinaryError) {
        console.error("Error deleting image from Cloudinary:", cloudinaryError.message);
      }
    }

    const deletedClaim = await ClaimItem.findByIdAndDelete(id);

    return res.status(200).json({ 
      success: true, 
      message: "Claim deleted successfully",
      deletedId: id
    });
  } catch (error) {
    console.error("Error in deleteClaim:", error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllClaims = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: "User ID is required" 
      });
    }

    // Fetch user details
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Fetch all claims with proper population
    const claims = await ClaimItem.find()
      .populate({
        path: 'userId',
        select: 'name email role'
      })
      .populate({
        path: 'foundItemId',
        select: 'name location category userId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });

    if (!claims || claims.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        message: "No claims found",
        count: 0
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: claims,
      count: claims.length,
      message: "Claims retrieved successfully"
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server Error",
      error: error.message 
    });
  }
};