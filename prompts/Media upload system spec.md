# Media Upload System — Implementation Spec
**Project:** FlatNFlatmates.in
**Scope:** Image & Video processing pipeline for property listings
**Stack:** MongoDB, AWS S3 (existing bucket), Next.js
**Background processing approach:** AWS Lambda (S3-triggered) — finalized, see Section 5

---

## 0. Ground Rules for Implementation (READ FIRST)

- **You may modify existing code, schemas, and endpoints where needed to implement this cleanly** — you are not restricted to purely additive changes. The priority is a working, well-integrated feature, not avoiding touching existing files.
- **The one hard requirement: do not break anything that currently works.** Before changing any existing file, route, schema, or component, understand what currently depends on it. After changes, existing property listing flows (create, edit, delete, view) and all unrelated features must continue to work exactly as before.
- If modifying an existing upload endpoint, schema, or component is the cleanest way to add this feature, do it — just test the existing behavior still works afterward (see Section 10 checklist).
- **No new infrastructure should be provisioned without confirmation** (no new S3 buckets, no new CloudFront, no new servers/EC2 instances). Reuse the existing S3 bucket already defined in the system. AWS Lambda is the one new piece of infrastructure this spec requires — that's expected and fine.
- All new code must include **basic error handling and logging** — no silent failures. If a processing job fails, the listing's media status must reflect `failed`, not get stuck or crash the app.
- Write unit tests (or at minimum manual test steps) for: successful image processing, successful video processing, and failure/retry cases.
- **This system must not block or slow down the existing property listing creation flow.** Uploads should feel instant to the user; processing happens in the background.
- Confirm the current details before writing code — do not assume: Next.js version (Pages Router vs App Router), existing S3 SDK/client setup, existing file upload handling (e.g., `formidable`, `busboy`, `next-connect`, or native `FormData` parsing in a Route Handler), and existing MongoDB client/ODM (e.g., Mongoose vs native driver). Inspect the existing codebase first rather than guessing conventions.
- If you do need to change something existing to make this work well, prefer the smallest change that achieves it, and note in your PR/commit description what was changed and why, so it's easy to review.

---

## 1. Overview

We are adding a **background media processing pipeline** for property images and videos:

- **Images** → resized into 3 sizes (thumb/medium/full), converted to WebP, EXIF stripped.
- **Videos** → transcoded to a single fixed **720p MP4** rendition, max duration **5 minutes**, plus one auto-generated thumbnail frame.
- Processing happens **asynchronously** after upload — the listing UI shows a `processing` status until media is ready.
- No CDN is used in this phase — media is served directly from S3 URLs (public-read or signed URLs, matching however the current bucket is configured).

---

## 2. Architecture Diagram (text form)

```
[User uploads photo/video from listing form]
              │
              ▼
   [Existing upload API endpoint]
   (extend, do not replace)
              │
              ▼
   Raw file → S3 (existing bucket, "raw/" prefix folder)
              │
              ▼
   MongoDB: create media doc with status = "processing"
              │
              ▼
   Trigger background job (see Section 5 for options)
              │
       ┌──────┴───────┐
       ▼              ▼
  [Image job]     [Video job]
  Sharp resize    FFmpeg transcode
  + WebP convert  to 720p + thumbnail
       │              │
       ▼              ▼
  S3 "processed/" prefix (same bucket)
              │
              ▼
   MongoDB: update media doc, status = "ready", store keys/urls
              │
              ▼
   Frontend polls or listens for status, then displays media
```

---

## 3. MongoDB Schema Changes

**Do not create a new collection unless the current media model doesn't already exist as embedded/subdocuments.** Inspect current schema first. Below is the target shape — adapt field names to match existing naming conventions in the codebase.

### Image sub-document (embedded in Property/Listing document, or its own `Media` collection — match existing pattern)

```js
{
  _id: ObjectId,
  propertyId: ObjectId,
  type: "image",
  status: "processing" | "ready" | "failed",
  rawKey: "raw/images/{propertyId}/{uuid}.jpg",       // original upload, kept until processed (optional: delete after success to save cost)
  processedKeys: {
    thumb:  "processed/images/{propertyId}/{uuid}-thumb.webp",
    medium: "processed/images/{propertyId}/{uuid}-medium.webp",
    full:   "processed/images/{propertyId}/{uuid}-full.webp"
  },
  width: Number,
  height: Number,
  order: Number,          // for image ordering in gallery, only if this concept already exists
  error: String | null,   // populated if status = "failed"
  createdAt: Date,
  updatedAt: Date
}
```

### Video sub-document

```js
{
  _id: ObjectId,
  propertyId: ObjectId,
  type: "video",
  status: "processing" | "ready" | "failed",
  rawKey: "raw/videos/{propertyId}/{uuid}.mp4",
  processedKey: "processed/videos/{propertyId}/{uuid}-720p.mp4",
  thumbnailKey: "processed/videos/{propertyId}/{uuid}-thumb.jpg",
  durationSeconds: Number,   // must be <= 300 (5 min) — reject/flag if exceeded
  error: String | null,
  createdAt: Date,
  updatedAt: Date
}
```

**Migration note:** If a media field/array already exists on the Property model, add these as new fields on that existing structure rather than introducing a parallel collection. Confirm with existing schema before deciding.

---

## 4. Upload Flow (Backend)

### 4.1 Validation on upload (before anything hits S3)

- **Images:** accept `.jpg`, `.jpeg`, `.png`, `.webp`. Max raw upload size: 15MB (adjustable, confirm with team).
- **Videos:** accept `.mp4`, `.mov`. Max raw upload size: 300MB (generous ceiling; actual constraint is duration, not size).
- **Video duration check:** Before or immediately after upload, use `ffprobe` (comes bundled with ffmpeg) to check duration.
  - If duration > 300 seconds (5 minutes): **reject the upload** with a clear error message to the user ("Videos must be 5 minutes or shorter"). Do not process it further. Do not silently truncate.
- Do not change any existing validation for other file types/fields on the same form.

### 4.2 Upload handling

1. Existing endpoint (or new endpoint, matching current patterns) receives the file.
2. Upload raw file to S3 under `raw/images/{propertyId}/` or `raw/videos/{propertyId}/` — use existing S3 client/credentials already configured in the codebase.
3. Create the MongoDB media record with `status: "processing"`.
4. Enqueue a background job (see Section 5) — pass `propertyId`, `mediaId`, `rawKey`, `type`.
5. Respond to the client immediately with `{ mediaId, status: "processing" }` — **do not make the user wait for processing to complete.**

---

## 5. Background Processing — AWS Lambda (Finalized Approach)

This is the only approach to implement. Do not build an in-app/worker-based queue as an alternative.

- Configure an S3 event notification (`ObjectCreated`) on the existing bucket, scoped to the `raw/` prefix, to invoke a Lambda function.
- Two separate Lambda functions (recommended over one router function, for clean separation of dependencies/memory sizing):
  - `processImageLambda` — uses Sharp. Recommended memory: 1024 MB.
  - `processVideoLambda` — uses ffmpeg via a Lambda layer (e.g., a prebuilt `ffmpeg-layer` from the Lambda layer registry, or build your own layer with a static ffmpeg binary). Recommended memory: 2048 MB, timeout set to 10–13 minutes (leaving margin under the 15-minute hard limit).
- Lambda writes processed files back to the same bucket under `processed/`.
- **Status updates back to MongoDB — use the internal API callback pattern, not a direct DB connection from Lambda:**
  - Lambda calls a protected Next.js API route (e.g., `POST /api/internal/media/[mediaId]/complete`) when done, passing status + result keys.
  - This avoids storing MongoDB credentials in Lambda environment variables and keeps all DB writes going through your existing app layer (easier to audit, easier to keep validation consistent with the rest of the app).
  - Protect this route with a shared secret (e.g., a header token stored in both Lambda env vars and Next.js env vars) — it must not be callable by the public.
- **Constraints to design around:**
  - Lambda max execution time is 15 minutes; `/tmp` storage defaults to 512MB but is configurable up to 10GB. For 5-minute 720p video inputs, allocate at least 2–3GB of `/tmp` (raw input + intermediate + output file all need to fit).
  - Cold starts: the ffmpeg layer adds some cold-start latency (typically a few hundred ms to ~1-2s extra) — acceptable for background processing, not a concern since the user isn't waiting on it synchronously.
- Deployment: use whatever IaC/deployment method is already used for this project's AWS resources (e.g., Serverless Framework, AWS SAM, CDK, or the AWS Console if nothing else is set up yet) — confirm with the team which is already in use before introducing a new one.

---

## 6. Image Processing Logic (Sharp)

```js
const sharp = require('sharp');

async function processImage(inputBuffer) {
  const sizes = [
    { name: 'thumb', width: 300 },
    { name: 'medium', width: 800 },
    { name: 'full', width: 1600 }
  ];

  const outputs = {};
  for (const size of sizes) {
    outputs[size.name] = await sharp(inputBuffer)
      .rotate()                  // auto-orient based on EXIF, then strip EXIF below
      .resize({ width: size.width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  }
  return outputs; // upload each buffer to S3 under processed/ prefix
}
```

- `withoutEnlargement: true` ensures small images aren't upscaled (avoids quality loss/wasted size).
- EXIF is stripped automatically by Sharp's re-encode (no separate step needed), which also removes embedded GPS location data — important for user privacy on property photos.
- After successful upload of all 3 sizes to S3, update MongoDB doc: `status: "ready"`, populate `processedKeys`, `width`, `height`.
- On any failure (corrupt image, Sharp error, S3 upload failure): set `status: "failed"`, `error: <message>`, log the error server-side. Do not crash the job runner — catch and continue to next job.

---

## 7. Video Processing Logic (FFmpeg)

```bash
# Single 720p rendition, capped bitrate for balanced size
ffmpeg -i input.mp4 \
  -vf "scale=-2:720" \
  -c:v libx264 -preset medium -crf 23 -maxrate 2500k -bufsize 5000k \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  output-720p.mp4

# Thumbnail — grab a frame at 2 seconds
ffmpeg -i input.mp4 -ss 00:00:02 -vframes 1 thumb.jpg
```

Notes on the flags (for the agent's understanding, not to be changed without reason):
- `scale=-2:720` — scales to 720p height, keeps aspect ratio, width auto-adjusted to nearest even number.
- `-crf 23` — reasonable quality/size balance (lower = better quality/larger file; 23 is a sane default, don't go below 20 unless requested).
- `-maxrate 2500k -bufsize 5000k` — caps bitrate spikes to keep file size predictable ("balanced size" requirement).
- `-movflags +faststart` — moves metadata to the front of the file so videos start playing before fully downloaded (important for web playback).
- `-preset medium` — balance between encode speed and compression efficiency. Do not set to `ultrafast` (bloats size) or `veryslow` (too slow for Lambda time limits) without reason.

**Processing steps:**
1. Download raw video from S3 to local `/tmp` (or Lambda `/tmp`).
2. Run `ffprobe` to confirm duration ≤ 300s (double-check even if validated at upload time, as a safety net).
   - If duration exceeds 300s here: mark `status: "failed"`, `error: "Video exceeds 5 minute limit"`, do not process further.
3. Run the ffmpeg transcode command above.
4. Run the thumbnail extraction command.
5. Upload `output-720p.mp4` and `thumb.jpg` to S3 under `processed/videos/{propertyId}/`.
6. Update MongoDB: `status: "ready"`, `processedKey`, `thumbnailKey`, `durationSeconds`.
7. Clean up local `/tmp` files after upload (avoid disk buildup, especially important in Lambda's limited `/tmp`).
8. On any ffmpeg/ffprobe error or S3 failure: `status: "failed"`, `error: <message>`, log it. Never leave a record stuck in `processing` indefinitely — consider adding a timeout/retry mechanism (e.g., a scheduled check that flags jobs stuck in `processing` for over 20 minutes as `failed` for manual review).

---

## 8. Frontend Display Logic

### 8.1 Images
Use `srcset` so the browser automatically picks the right size — no manual quality/connection logic needed.

```html
<img
  srcset="{full_s3_url_thumb} 300w, {full_s3_url_medium} 800w, {full_s3_url_full} 1600w"
  sizes="(max-width: 600px) 300px, 800px"
  src="{full_s3_url_medium}"
  alt="Property photo"
  loading="lazy"
/>
```
- `loading="lazy"` — do not eager-load every gallery image on listing pages; improves initial page load.

### 8.2 Videos
Since there's only one 720p rendition (no adaptive quality switching needed), the video element is simple:

```html
<video controls poster="{thumbnail_s3_url}" preload="metadata">
  <source src="{processed_video_s3_url}" type="video/mp4" />
  Your browser does not support the video tag.
</video>
```
- `preload="metadata"` — avoids downloading the full video until the user hits play; only loads dimensions/poster info upfront. Good default for listing pages with multiple videos.
- `poster` uses the generated thumbnail so the page doesn't need to load/decode video just to show a preview frame.

### 8.3 Handling "processing" state in UI
- While `status === "processing"`: show a placeholder/spinner with text like "Processing video..." on the listing (agent should match this to existing UI patterns/component library already used in the app).
- Poll the media status endpoint every 5–10 seconds (or use existing real-time mechanism like websockets/SSE if the app already has one — do not introduce a new polling mechanism if a real-time system already exists) until `status` becomes `ready` or `failed`.
- If `failed`: show an error message and allow the user to re-upload, without needing to reload the whole listing form.

---

## 9. API Endpoints Needed

Confirm first whether the project uses the **Pages Router** (`pages/api/...`) or **App Router** (`app/api/.../route.ts`) and follow whichever is already in use — do not mix conventions. Match existing auth middleware/session handling and response format patterns already used elsewhere in the app.

| Method | Route (App Router style — adapt if Pages Router) | Purpose |
|---|---|---|
| POST | `/api/properties/[id]/media/upload` | Accept raw file, upload to S3 `raw/`, create Mongo record, respond immediately with `processing` status. (S3 event → Lambda handles the rest; this route does not enqueue anything itself.) Extend an existing upload route if one already exists rather than duplicating it. |
| GET | `/api/properties/[id]/media/[mediaId]/status` | Return current `status` for frontend polling. |
| POST | `/api/internal/media/[mediaId]/complete` | Called by Lambda to mark a job `ready` or `failed` and store result keys. Must be protected with a shared-secret header check — never publicly callable, and not linked from any frontend code. |
| DELETE | `/api/properties/[id]/media/[mediaId]` | Existing or new — ensure it removes both `raw/` and `processed/` S3 objects along with the Mongo record, to avoid orphaned S3 storage costs. |

**Note on file upload handling in Next.js:** if using the App Router, Route Handlers can read `request.formData()` natively for multipart uploads — no need for `multer`. If using the Pages Router, `bodyParser` must be disabled for this route (`export const config = { api: { bodyParser: false } }`) and a library like `formidable` or `busboy` used to parse the incoming stream. Check which pattern the existing codebase already uses before introducing a new one.

---

## 10. Testing Checklist Before Merge

- [ ] Upload a normal JPEG/PNG photo → confirm 3 sizes generated, correct WebP output, EXIF/GPS data stripped.
- [ ] Upload a very small image (e.g., 100x100) → confirm it is NOT upscaled.
- [ ] Upload a corrupt/invalid image file → confirm graceful `failed` status, no crash.
- [ ] Upload a video under 5 minutes → confirm 720p output + thumbnail generated correctly, plays in browser.
- [ ] Upload a video over 5 minutes → confirm it is rejected (either at upload validation or processing stage) with a clear error, and does NOT get processed.
- [ ] Upload a very large raw video file (near the size ceiling) → confirm no timeout/crash in the processing job.
- [ ] Confirm existing listing creation/edit flow still works exactly as before for all fields unrelated to media.
- [ ] Confirm no existing S3 objects, MongoDB documents, or API routes were altered or deleted as a side effect.
- [ ] Confirm deleting a listing/media item also cleans up associated S3 objects (no orphaned storage).
- [ ] Load test: confirm processing several images/videos concurrently doesn't degrade the main Next.js app's performance (should be minimal impact, since processing runs in Lambda, not in the Next.js server process).
- [ ] Confirm stuck `processing` records (e.g., Lambda job crashed or timed out) don't stay stuck forever — timeout/retry logic works.
- [ ] Confirm the `/api/internal/media/[mediaId]/complete` route rejects requests without the correct shared secret.

---

## 11. Explicitly Out of Scope for This Phase

- No CloudFront or any CDN — media served directly from S3.
- No multiple video renditions/adaptive bitrate streaming — single fixed 720p only.
- No in-app/worker-based processing queue — Lambda is the finalized approach; don't build an alternative.
- No changes to authentication, listing approval workflows, search/filtering, or any other unrelated system feature, unless a small touch to one of these is strictly necessary to wire up media status (e.g., adding a media status field to an existing listing query) — if so, keep the change minimal and confirm nothing else in that flow broke.
- No new S3 buckets — reuse the existing bucket with `raw/` and `processed/` prefixes.

--