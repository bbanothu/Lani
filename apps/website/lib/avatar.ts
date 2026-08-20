import { supabase } from '@/lib/supabase';
import { updateAvatarUrl } from '@/lib/auth';

/** Uploads a picked file to the user's own folder in the `avatars` bucket and saves the public URL. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { contentType: file.type || `image/${ext}`, upsert: true });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(path);
  // Cache-bust so the new image shows immediately instead of a stale cached one at the same URL.
  const url = `${publicUrl}?t=${Date.now()}`;

  const err = await updateAvatarUrl(url);
  if (err) throw new Error(err);
  return url;
}
