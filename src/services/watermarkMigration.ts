/**
 * Watermark Migration Stopped
 * As per new requirements:
 * Images in Supabase remain clean originals.
 * Watermark is applied dynamically on client download (via downloadWithWatermark).
 * No overwriting of Supabase images.
 */

export interface MigrationProgress {
  current: number;
  total: number;
  message: string;
  isComplete: boolean;
}

export const migrateAllProductImagesWatermark = async (
  onProgress?: (progress: MigrationProgress) => void
): Promise<{ totalProducts: number; totalImages: number; fixedImages: number; failedImages: number }> => {
  console.log('[Watermark Migration] Stopped: dynamic watermark on download is now active.');
  if (onProgress) {
    onProgress({
      current: 0,
      total: 0,
      message: 'Migration stopped - dynamic download watermark active',
      isComplete: true
    });
  }
  return { totalProducts: 0, totalImages: 0, fixedImages: 0, failedImages: 0 };
};
