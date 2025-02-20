import { supabase } from '../lib/supabaseClient';
import { BusinessImage, CreateBusinessImageDTO } from '../types/business';

// Helper function to get next order number
async function getNextOrder(businessId: string, type: 'product' | 'company'): Promise<number> {
  const { data, error } = await supabase
    .from('business_images')
    .select('order')
    .eq('business_id', businessId)
    .eq('type', type)
    .order('order', { ascending: false })
    .limit(1);
  
  if (error) throw error;
  return data && data.length > 0 ? data[0].order + 1 : 0;
}

export const businessImagesService = {
  // Get all images for a business
  async getBusinessImages(businessId: string, type: 'product' | 'company'): Promise<BusinessImage[]> {
    const { data, error } = await supabase
      .from('business_images')
      .select('*')
      .eq('business_id', businessId)
      .eq('type', type)
      .order('order');
    
    if (error) throw error;
    return data;
  },

  // Add new image
  async addImage(image: CreateBusinessImageDTO): Promise<BusinessImage> {
    // Check image count limit
    const { count, error: countError } = await supabase
      .from('business_images')
      .select('id', { count: 'exact' })
      .eq('business_id', image.business_id)
      .eq('type', image.type);

    if (countError) throw countError;

    const maxImages = image.type === 'product' ? 20 : 2;
    if (count && count >= maxImages) {
      throw new Error(`Dosažen maximální počet obrázků (${maxImages})`);
    }

    const { data, error } = await supabase
      .from('business_images')
      .insert({
        ...image,
        order: await getNextOrder(image.business_id, image.type)
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete image
  async deleteImage(imageId: string): Promise<void> {
    const { error } = await supabase
      .from('business_images')
      .delete()
      .eq('id', imageId);
    
    if (error) throw error;
  }
};