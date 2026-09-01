import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';
import { updateAvatarUrl } from './auth';

/** Lets the user pick a photo, uploads it to their own folder in the `avatars` bucket, and saves the public URL. Returns the new URL, or null if cancelled. */
export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const perms = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perms.granted) throw new Error('Photo library permission denied');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
  });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset?.base64) return null;

  const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/avatar.${ext}`;
  const base64 = asset.base64;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, decode(base64), {
      contentType: asset.mimeType || `image/${ext}`,
      upsert: true,
    });
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
