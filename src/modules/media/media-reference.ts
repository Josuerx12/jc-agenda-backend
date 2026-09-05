import { MediaReferenceDto } from './dto/media-reference.dto';

export function buildMediaReference(
  mediaId: string | null | undefined,
): MediaReferenceDto | null {
  if (!mediaId) return null;

  const url = `/media/${mediaId}`;
  return {
    id: mediaId,
    url,
    downloadUrl: `${url}?download=true`,
  };
}
