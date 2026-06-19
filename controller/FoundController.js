import Found from "../model/FoundModel.js";
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

export const createFoundItem = async (req, res) => {
  try {
    const { name, description, location, contactInfo } = req.body;
    if (!name || !description || !location || !contactInfo) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    const existingItem = await Found.findOne({
      name: name.trim(),
      userId: req.userId
    });

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: "You already created this item"
      });
    }

    let imageData = null;

    if (req.file?.buffer) {

      try {
        const uploadedImage = await uploadBufferToCloudinary(
          req.file.buffer,
          "Found_Items"
        );

        imageData = {
          public_id: uploadedImage.public_id,
          url: uploadedImage.secure_url,
        };

      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image to cloud storage",
        });
      }
    } else {
      console.log("No image file provided");
    }

    const foundItem = await Found.create({
      name: name.trim(),
      description,
      location: location.trim(),
      contactInfo,
      foundimage: imageData,
      userId: req.userId
    });


    res.status(201).json({
      success: true,
      message: "Found item created successfully",
      data: foundItem
    });

  } catch (error) {
    console.error("❌ Create Found Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

export const getAllFoundItems = async (req, res) => {
  try {
    const foundItems = await Found.find().populate("userId", "name");
    if (foundItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No found items available"
      });
    }
    res.status(200).json({
      success: true,
      message: "Found items retrieved successfully",
      data: foundItems
    });
  } catch (error) {
    console.error("Get Found Items Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getFoundItemById = async (req, res) => {
  try {
   const userId = req.userId;
  const foundItems=await Found.find({  userId } );
  if (!foundItems || foundItems.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No found items found for this user"
    });
  }
  res.status(200).json({
    success: true,
    message: "Found items retrieved successfully",
    data: foundItems
  });
  } catch (error) {
    console.error("Get Found Item By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const deleteFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const foundItem = await Found.findByIdAndDelete(id);
    if (!foundItem) {
      return res.status(404).json({
        success: false,
        message: "Found item not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Found item deleted successfully"
    });
  }
    catch (error) {
    console.error("Delete Found Item Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const updateFoundItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location, contactInfo } = req.body;

    const existingItem = await Found.findById(id);

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Found item not found"
      });
    }

    if (existingItem.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own items"
      });
    }

    const updateData = {
      name: name || existingItem.name,
      description: description || existingItem.description,
      location: location || existingItem.location,
      contactInfo: contactInfo || existingItem.contactInfo,
    };

    if (req.file?.buffer) {

      if (existingItem.foundimage?.public_id) {
        try {
          await cloudinary.uploader.destroy(existingItem.foundimage.public_id);
          console.log("Old image deleted");
        } catch (err) {
          console.warn(" Could not delete old image:", err.message);
        }
      }

      try {
        console.log("📤 Uploading new image to Cloudinary...");
        const uploadedImage = await uploadBufferToCloudinary(
          req.file.buffer,
          "Found_Items"
        );

        updateData.foundimage = {
          public_id: uploadedImage.public_id,
          url: uploadedImage.secure_url,
        };

        console.log("✅ New image uploaded successfully:", uploadedImage.secure_url);
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload new image to cloud storage",
        });
      }
    }

    // Update the item
    const updateItem = await Found.findByIdAndUpdate(id, updateData,   { returnDocument: "after" });
    res.status(200).json({
      success: true,
      message: "Found item updated successfully",
      data: updateItem
    });

  } catch (error) {
    console.error("Update Found Item Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
    

