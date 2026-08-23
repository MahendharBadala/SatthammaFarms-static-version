import os
import uuid
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

def upload_media(file_bytes, filename, folder="satthamma-farms"):
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        public_id=str(uuid.uuid4()),
        resource_type="auto",
        overwrite=False,
        use_filename=True,
        unique_filename=True,
    )

    return result