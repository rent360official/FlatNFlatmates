# Media Processing Lambda Functions

This directory contains AWS Lambda functions for automated, asynchronous image and video processing for **FlatNFlatmates.in**.

## Architecture
- **Trigger**: S3 `ObjectCreated` event on existing bucket scoped to `raw/` prefix:
  - `raw/images/*` ➔ triggers `processImage`
  - `raw/videos/*` ➔ triggers `processVideo`
- **Output**: Saves processed renditions to `processed/` prefix:
  - `processed/images/{propertyId}/{uuid}-thumb.webp` (300px width)
  - `processed/images/{propertyId}/{uuid}-medium.webp` (800px width)
  - `processed/images/{propertyId}/{uuid}-full.webp` (1600px width)
  - `processed/videos/{propertyId}/{uuid}-720p.mp4` (720p H.264, AAC, 2500k bitrate, faststart)
  - `processed/videos/{propertyId}/{uuid}-thumb.jpg` (2-second poster frame)
- **Callback**: Calls `POST /api/internal/media/[mediaId]/complete` on the Next.js app with `x-internal-media-secret` to update MongoDB status to `ready` and delete raw S3 objects.

---

## 1. Deploy with AWS SAM

Ensure AWS CLI and AWS SAM CLI are installed:

```bash
cd lambda
sam build
sam deploy
```

When deployed, SAM outputs the ARNs of the two Lambda functions:
- `ProcessImageFunctionArn`
- `ProcessVideoFunctionArn`

---

## 2. Connect S3 Event Triggers to Bucket

Since `flatnflatmate-dir-dev` already exists, connect the notifications in the AWS Console (or via CLI):

### Option A: Via AWS S3 Console (Recommended & Easiest)
1. Open AWS S3 Console -> Go to bucket **`flatnflatmate-dir-dev`**.
2. Go to the **Properties** tab -> Scroll down to **Event notifications** -> Click **Create event notification**.
3. **Image Notification**:
   - Event name: `ProcessRawImages`
   - Prefix: `raw/images/`
   - Event types: Check **All object create events** (`s3:ObjectCreated:*`)
   - Destination: **Lambda function** -> Select `ProcessImageFunction`
   - Click **Save changes**.
4. **Video Notification**:
   - Event name: `ProcessRawVideos`
   - Prefix: `raw/videos/`
   - Event types: Check **All object create events** (`s3:ObjectCreated:*`)
   - Destination: **Lambda function** -> Select `ProcessVideoFunction`
   - Click **Save changes**.

---

## 3. Environment Variables in Next.js

Ensure `.env` contains:
```env
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=flatnflatmate-dir-dev
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
INTERNAL_MEDIA_SECRET=flatnflatmates_internal_media_secret_prod_key_2026
```

