import { supabase } from './supabase';

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function compressImage(
  file: File,
  options: ImageUploadOptions = {}
): Promise<Blob> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type || 'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file: File): Promise<string> {
  // Check file size (4MB limit)
  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB in bytes
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 4MB limit');
  }
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be signed in to upload images');
  }
  
  // Compress image if it's larger than 1MB
  let imageToUpload: Blob = file;
  if (file.size > 1024 * 1024) {
    try {
      imageToUpload = await compressImage(file);
    } catch (error) {
      console.error('Failed to compress image:', error);
      // Continue with original file if compression fails
    }
  }
  
  // Generate unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('editor-images')
    .upload(fileName, imageToUpload, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('editor-images')
    .getPublicUrl(data.path);
  
  return publicUrl;
}

export function isImageFile(file: File): boolean {
  const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return acceptedTypes.includes(file.type);
}