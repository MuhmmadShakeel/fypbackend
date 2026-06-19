import Lost from "../model/LostModel.js";
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

export const createLost = async (req, res) => {
  try {

    const { name, description, location } = req.body;
    const userId = req.userId;

    // ✅ Validation
    if (!name || !description || !location) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    // ✅ Duplicate check
    const existingLost = await Lost.findOne({
      name: name.trim(),
      location: location.trim(),
      userId: userId
    });

    if (existingLost) {
      return res.status(409).json({
        success: false,
        message: "This lost item is already posted"
      });
    }

    let imageData = null;

    if (req.file?.buffer) {
      try {
        const uploadedImage = await uploadBufferToCloudinary(
          req.file.buffer,
          "Lost_Items"
        );

        imageData = {
          public_id: uploadedImage.public_id,
          url: uploadedImage.secure_url,
        };
      } catch (uploadError) {
        console.error("Cloudinary Upload Error:", uploadError);

        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }
    }
    // ✅ Create record
    const lost = await Lost.create({
      name: name.trim(),
      description,
      location: location.trim(),
      lostimage: imageData,
      userId
    });

    // ✅ Response
    res.status(201).json({
      success: true,
      message: "Lost item created successfully",
      data: lost
    });

  } catch (error) {

    console.error("Create Lost Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });

  }
};

export const getAllLost = async (req, res) => {
  try {
    const lostItems = await Lost.find().sort({ createdAt: -1 });
     if (lostItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No lost items found"
      });
    } 
    res.status(200).json({
      success: true,
      message: "Lost items retrieved successfully",
      data: lostItems
    });
  } catch (error) {
    console.error("Get All Lost Error:", error);
    res.status(500).json({  
      success: false,
      message: "Internal server error"
    });
  }
};

export const getLostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lost item ID is required"
      });
    }

    const lostItem = await Lost.findById(id);

    if (!lostItem) {
      return res.status(404).json({
        success: false,
        message: "Lost item not found"
      });
    }

    // Check if the user owns this item (optional, depending on requirements)
    // If you want users to only see their own items, uncomment the next lines:
    // if (lostItem.userId.toString() !== req.userId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "You can only view your own lost items"
    //   });
    // }

    res.status(200).json({
      success: true,
      message: "Lost item retrieved successfully",
      data: lostItem
    });
  } catch (error) {
    console.error("Get Lost By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getLostByUserId = async (req, res) => {
  try {
    const userId = req.userId;

    const lostItems = await Lost.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "User's lost items retrieved successfully",
      data: lostItems
    });
  } catch (error) {
    console.error("Get Lost By User ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const deleteLost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lost item ID is required"
      });
    }

    const lostItem = await Lost.findById(id);

    if (!lostItem) {
      return res.status(404).json({
        success: false,
        message: "Lost item not found"
      });
    }

    // Check if the user owns this item
    if (lostItem.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own lost items"
      });
    }

    // Delete the image from Cloudinary if it exists
    if (lostItem.lostimage?.public_id) {
      try {
        await cloudinary.uploader.destroy(lostItem.lostimage.public_id);
      } catch (cloudinaryError) {
        console.error("Cloudinary delete error:", cloudinaryError);
        // Don't fail the deletion if image delete fails
      }
    }

    await Lost.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Lost item deleted successfully"
    });
  } catch (error) {
    console.error("Delete Lost Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const updateLost = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location } = req.body;

    // Check ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lost item ID is required",
      });
    }

    // Find existing item
    const existingLost = await Lost.findById(id);

    if (!existingLost) {
      return res.status(404).json({
        success: false,
        message: "Lost item not found",
      });
    }

    // Ownership check
    if (existingLost.userId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own lost items",
      });
    }

    // Prepare update data
    let updateData = {
      name: name?.trim() || existingLost.name,
      description: description || existingLost.description,
      location: location?.trim() || existingLost.location,
    };

    // Handle image upload
    if (req.file?.buffer) {
      try {
        if (existingLost.lostimage?.public_id) {
          await cloudinary.uploader.destroy(existingLost.lostimage.public_id);
        }

        const uploadedImage = await uploadBufferToCloudinary(
          req.file.buffer,
          "Lost_Items"
        );

        updateData.lostimage = {
          public_id: uploadedImage.public_id,
          url: uploadedImage.secure_url,
        };
      } catch (uploadError) {
        console.error("Image Upload Error:", uploadError);

        return res.status(500).json({
          success: false,
          message: "Failed to upload image",
        });
      }
    }

    // Update database
    const updatedLost = await Lost.findByIdAndUpdate(
      id,
      updateData,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Lost item updated successfully",
      data: updatedLost,
    });

  } catch (error) {

    console.error("Update Lost Error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
