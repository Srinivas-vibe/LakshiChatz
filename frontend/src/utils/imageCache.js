import * as FileSystem from 'expo-file-system';

/**
 * Image Cache Utility
 * Downloads and caches images (like profile pictures) locally to avoid repeated network requests.
 * Uses expo-file-system to store images in the document directory.
 */
const IMAGE_CACHE_DIR = `${FileSystem.documentDirectory}image_cache/`;

/**
 * Ensure the cache directory exists.
 */
const ensureCacheDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
  }
};

/**
 * Generate a safe filename from a URL.
 * @param {string} url - The image URL.
 * @returns {string} Safe filename.
 */
const getFilenameFromUrl = (url) => {
  // Simple hash or just replace special characters
  const extension = url.split('.').pop().split('?')[0] || 'jpg';
  const name = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${name.substring(name.length - 50)}.${extension}`;
};

/**
 * Get a cached image URI for a given URL.
 * If not cached, downloads and caches it.
 * @param {string} url - The remote image URL.
 * @returns {Promise<string>} Local file URI.
 */
export const getCachedImage = async (url) => {
  if (!url) return null;

  try {
    await ensureCacheDirExists();
    const filename = getFilenameFromUrl(url);
    const fileUri = `${IMAGE_CACHE_DIR}${filename}`;

    // Check if file exists in cache
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      return fileUri;
    }

    // Download if not cached
    const downloadRes = await FileSystem.downloadAsync(url, fileUri);
    return downloadRes.uri;
  } catch (error) {
    console.warn('Failed to cache image:', error.message);
    // Fallback to remote URL on error
    return url;
  }
};

/**
 * Clear the image cache.
 */
export const clearImageCache = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(IMAGE_CACHE_DIR, { idempotent: true });
      console.log('🖼️ Image cache cleared');
    }
  } catch (error) {
    console.error('Failed to clear image cache:', error.message);
  }
};

export default {
  getCachedImage,
  clearImageCache,
};
