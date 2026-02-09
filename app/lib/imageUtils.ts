/**
 * Client-side image optimization utilities
 * - Compresses images to reduce file size
 * - Converts to WebP format where supported
 * - Generates blur placeholder data URLs
 * - Resizes images to maximum dimensions
 */

export interface OptimizedImage {
  blob: Blob;
  width: number;
  height: number;
  blurDataUrl: string;
}

export interface ImageOptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  generateBlur?: boolean;
}

const DEFAULT_OPTIONS: Required<ImageOptimizeOptions> = {
  maxWidth: 1920,
  maxHeight: 1440,
  quality: 0.82,
  generateBlur: true,
};

/**
 * Check if browser supports WebP encoding
 */
function supportsWebP(): boolean {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Scale down if exceeds max dimensions
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  return { width, height };
}

/**
 * Generate a tiny blur placeholder (10px wide)
 */
function generateBlurPlaceholder(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Create tiny 10px wide placeholder
  const aspectRatio = img.height / img.width;
  canvas.width = 10;
  canvas.height = Math.round(10 * aspectRatio);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Return as low-quality JPEG data URL
  return canvas.toDataURL("image/jpeg", 0.3);
}

/**
 * Compress and optimize an image file
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizeOptions = {}
): Promise<OptimizedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Load image
  const img = await loadImage(file);

  // Calculate target dimensions
  const { width, height } = calculateDimensions(
    img.naturalWidth,
    img.naturalHeight,
    opts.maxWidth,
    opts.maxHeight
  );

  // Create canvas and draw resized image
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  canvas.width = width;
  canvas.height = height;

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  // Generate blur placeholder if requested
  const blurDataUrl = opts.generateBlur ? generateBlurPlaceholder(img) : "";

  // Convert to WebP if supported, otherwise JPEG
  const mimeType = supportsWebP() ? "image/webp" : "image/jpeg";

  // Convert canvas to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to create blob"));
      },
      mimeType,
      opts.quality
    );
  });

  return {
    blob,
    width,
    height,
    blurDataUrl,
  };
}

/**
 * Optimize multiple images in parallel
 */
export async function optimizeImages(
  files: File[],
  options: ImageOptimizeOptions = {}
): Promise<OptimizedImage[]> {
  return Promise.all(files.map((file) => optimizeImage(file, options)));
}

/**
 * Get the file extension for optimized images
 */
export function getOptimizedExtension(): string {
  return supportsWebP() ? "webp" : "jpg";
}

/**
 * Get the MIME type for optimized images
 */
export function getOptimizedMimeType(): string {
  return supportsWebP() ? "image/webp" : "image/jpeg";
}
