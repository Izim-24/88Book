// ImageAnalysisService ("Search by image" sequence 3.3): extractFeatures(image)
//   3.3.1 preprocessImage()  - fix orientation, crop to the customer's marked object
//   3.3.2 detectObjects()    - trim plain background around the object
//   3.3.3 visualFeatures     - shape hash + colour histogram used for similarity
// Pure image processing with sharp: offline, no model download.
import sharp from "sharp";

const HASH_WIDTH = 9;
const HASH_HEIGHT = 8;
const HISTOGRAM_BINS = 4; // per channel -> 64 colour bins
const MIN_SELECTION = 0.05; // ignore accidental clicks smaller than 5% of a side

// Validates a selection given as fractions of the image: { x, y, width, height } in 0..1.
export const parseSelection = (value) => {
  if (value == null || value === "") return null;
  let selection = value;
  if (typeof value === "string") {
    try {
      selection = JSON.parse(value);
    } catch {
      return null;
    }
  }
  const parts = ["x", "y", "width", "height"].map((key) => Number(selection?.[key]));
  if (parts.some((part) => !Number.isFinite(part))) return null;
  let [x, y, width, height] = parts;
  x = Math.min(Math.max(x, 0), 1);
  y = Math.min(Math.max(y, 0), 1);
  width = Math.min(width, 1 - x);
  height = Math.min(height, 1 - y);
  if (width < MIN_SELECTION || height < MIN_SELECTION) return null;
  return { x, y, width, height };
};

export async function preprocessImage(buffer, selection = null) {
  // rotate() applies EXIF orientation so phone photos are upright before cropping.
  const upright = await sharp(buffer).rotate().toBuffer({ resolveWithObject: true });
  let image = sharp(upright.data);
  const { width, height } = upright.info;
  if (selection) {
    image = image.extract({
      left: Math.floor(selection.x * width),
      top: Math.floor(selection.y * height),
      width: Math.max(1, Math.floor(selection.width * width)),
      height: Math.max(1, Math.floor(selection.height * height)),
    });
  }
  return image.png().toBuffer();
}

export async function detectObjects(buffer) {
  // Removes uniform borders (table, wall, white margin) around the cover. Repeats
  // because a photo of a product image can have several layers of background.
  let current = buffer;
  for (let pass = 0; pass < 3; pass++) {
    try {
      const before = await sharp(current).metadata();
      const trimmed = await sharp(current).trim({ threshold: 25 }).toBuffer({ resolveWithObject: true });
      const { width, height } = trimmed.info;
      if (width < 24 || height < 24) break;
      if (width === before.width && height === before.height) break;
      // Drop the blended edge left by compression so the next pass sees the
      // inner background colour, not a mix of both.
      current = await sharp(trimmed.data)
        .extract({ left: 3, top: 3, width: width - 6, height: height - 6 })
        .toBuffer();
    } catch {
      break; // Nothing to trim (or a single-colour image).
    }
  }
  return current;
}

const differenceHash = async (buffer) => {
  const pixels = await sharp(buffer)
    .greyscale()
    .resize(HASH_WIDTH, HASH_HEIGHT, { fit: "fill" })
    .raw()
    .toBuffer();
  let bits = "";
  for (let row = 0; row < HASH_HEIGHT; row++) {
    for (let col = 0; col < HASH_WIDTH - 1; col++) {
      const index = row * HASH_WIDTH + col;
      bits += pixels[index] < pixels[index + 1] ? "1" : "0";
    }
  }
  return BigInt(`0b${bits}`).toString(16).padStart(16, "0");
};

const colourHistogram = async (buffer) => {
  const pixels = await sharp(buffer)
    .removeAlpha()
    .resize(32, 32, { fit: "fill" })
    .raw()
    .toBuffer();
  const bins = new Array(HISTOGRAM_BINS ** 3).fill(0);
  const step = 256 / HISTOGRAM_BINS;
  for (let i = 0; i < pixels.length; i += 3) {
    const r = Math.floor(pixels[i] / step);
    const g = Math.floor(pixels[i + 1] / step);
    const b = Math.floor(pixels[i + 2] / step);
    bins[(r * HISTOGRAM_BINS + g) * HISTOGRAM_BINS + b] += 1;
  }
  const total = pixels.length / 3;
  return bins.map((count) => Number((count / total).toFixed(4)));
};

export async function computeVisualFeatures(buffer) {
  const [dHash, histogram] = await Promise.all([differenceHash(buffer), colourHistogram(buffer)]);
  return { dHash, histogram };
}

export async function extractFeatures(buffer, selection = null) {
  const prepared = await preprocessImage(buffer, selection);
  const object = await detectObjects(prepared);
  return { image: object, features: await computeVisualFeatures(object) };
}

const hammingSimilarity = (a, b) => {
  let diff = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let distance = 0;
  while (diff) {
    distance += Number(diff & 1n);
    diff >>= 1n;
  }
  return 1 - distance / ((HASH_WIDTH - 1) * HASH_HEIGHT);
};

const histogramSimilarity = (a, b) => a.reduce((sum, value, index) => sum + Math.min(value, b[index] || 0), 0);

// 0..1, where 1 means the same picture. Shape matters more than colour.
export const visualSimilarity = (a, b) =>
  Number((0.6 * hammingSimilarity(a.dHash, b.dHash) + 0.4 * histogramSimilarity(a.histogram, b.histogram)).toFixed(3));
