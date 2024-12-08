# VIZ Tweak

VIZ Tweak is a web app for hosting media files. It supports dynamic conversion of images, videos based on links. Save files to S3 and convert them using imagor, ffmpeg.

> [!WARNING]
> The project is being developed incrementally and the implemented features are available.
> It is better to upload only image files now.

Here's a refined version of your feature list with some enhancements for clarity and completeness:

## Features

- **S3 File Storage**:
  - [x] Save files directly to Amazon S3.

- **Image Conversion with Imagor**:
  - [x] **Resizing**: Adjust image dimensions to fit various needs.
  - [x] **Format Conversion**: Convert images to different formats (e.g., JPEG to PNG).
  - [x] **Rotation**: Rotate images as required.
  - [ ] **Metadata Omission**: Remove metadata from images to reduce file size or for privacy concerns.
  - [ ] **Watermarking**: Add watermarks to images for branding or copyright protection.

- **Video Conversion with FFmpeg**:
  - [ ] Convert video files, potentially including format changes, encoding, trimming, etc.

- **Other Types of Files** (e.g., PDF, Word, Excel, etc.):
  - [ ] Preview
  - [ ] Upload

- **User Authorization**:
  - [x] **Trusted Header SSO**: Utilize trusted headers for user authentication.
  - [ ] **Login Button**: Redirect users to an external login page.

- **AI Integration**:
  - [x] Utilize AI to generate or extract useful information from images (e.g., object detection, description generation).

- **I18n**:
  - [ ] English
  - [ ] Simplified Chinese

## LICENSE

MIT.
