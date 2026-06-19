import ReturnItem from "../model/ReturnItemModel.js";
import Lost from "../model/LostModel.js";
import User from "../model/UserModel.js";
import cloudinary from "../config/Cloudinary.js";
import dotenv from "dotenv";
dotenv.config();
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

export const returnItem = async (req, res) => {
  try {
    const userId = req.userId
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lost Item ID is required",
      });
    }

    const { name, contact, details } = req.body;

    if (!name || !contact || !details) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const lostItem = await Lost.findById(id).populate("userId");

    if (!lostItem) {
      return res.status(404).json({
        success: false,
        message: "Lost item not found",
      });
    }

    const ownerEmail = lostItem.userId?.email;

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
        "returnItems"
      );

      imageData = {
        url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
      };
    }

    const newReturn = await ReturnItem.create({
      userId,
      name,
      contact,
      details,
      returnImage: imageData,
      lostItem: id,
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_MAIL,
        pass: process.env.USER_PASS,
      },
    });

    let emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #1E3A8A, #3730A3); padding: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Item Return Notification</h1>
            <p style="color: #E0E7FF; margin: 8px 0 0 0; font-size: 14px;">Someone wants to return your lost item</p>
          </div>
          
          <div style="padding: 24px;">
            <h3 style="color: #1E3A8A; margin-top: 0;">Return Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-weight: bold;">Returner Name:</td>
                <td style="padding: 8px 0; color: #1F2937;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-weight: bold;">Contact:</td>
                <td style="padding: 8px 0; color: #1F2937;">${contact}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-weight: bold;">Details:</td>
                <td style="padding: 8px 0; color: #1F2937;">${details}</td>
              </tr>
            </table>
    `;

    if (imageData.url) {
      emailHtml += `
            <h3 style="color: #1E3A8A; margin-top: 24px;">Proof Image</h3>
            <img src="${imageData.url}" style="max-width: 100%; border-radius: 8px; margin-top: 12px;" />
      `;
    }

    emailHtml += `
            <h3 style="color: #1E3A8A; margin-top: 24px;">Item Info</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-weight: bold;">Item Name:</td>
                <td style="padding: 8px 0; color: #1F2937;">${lostItem.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-weight: bold;">Location:</td>
                <td style="padding: 8px 0; color: #1F2937;">${lostItem.location}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280; font-weight: bold;">Description:</td>
                <td style="padding: 8px 0; color: #1F2937;">${lostItem.description}</td>
              </tr>
            </table>
            
            <div style="margin-top: 24px; padding: 16px; background: #EEF2FF; border-radius: 8px;">
              <p style="margin: 0; color: #4F46E5;">Contact the returner to arrange the item handover.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `Lost and Found <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      subject: "Someone Wants to Return Your Lost Item",
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      success: true,
      message: "Return request submitted successfully",
      newReturn,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getReturnInfo = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    const returnInfo = await ReturnItem.find({ userId })
      .populate('userId', 'name')
      .populate('lostItem');
    return res.status(200).json({ success: true, returnInfo });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteReturn = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Return ID is required" });
    }

    const returnReq = await ReturnItem.findById(id);
    if (!returnReq) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    if (returnReq.returnImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(returnReq.returnImage.public_id);
      } catch (cloudinaryError) {
        console.error("Error deleting image from Cloudinary:", cloudinaryError.message);
      }
    }

    const deletedReturn = await ReturnItem.findByIdAndDelete(id);

    return res.status(200).json({ 
      success: true, 
      message: "Return request deleted successfully",
      deletedId: id
    });
  } catch (error) {
    console.error("Error in deleteReturn:", error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllReturns = async (req, res) => {
  try {
    const returns = await ReturnItem.find()
      .populate('userId', 'name email')
      .populate('lostItem')
      .sort({ createdAt: -1 });


    return res.status(200).json({ 
      success: true, 
      data: returns,
      totalReturns: returns.length
    });
  } catch (error) {
    console.error("❌ Error in getAllReturns:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Server Error",
      error: error.message 
    });
  }
};
