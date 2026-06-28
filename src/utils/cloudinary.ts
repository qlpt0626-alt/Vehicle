export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export const uploadImageToCloudinary = async (file: File): Promise<CloudinaryUploadResult> => {
  const url = 'https://api.cloudinary.com/v1_1/dqj4jmv7c/image/upload';
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'vehicle-repair-images');

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
    };
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};
