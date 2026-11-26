import { ImageOff } from "lucide-react";
import { useObjectUrl } from "@/hooks/use-object-url";
import { useInspectionImage } from "@/services/queries";

export function ProtectedImage({
  imageRef,
  loggedInUserId,
  alt,
  className = "",
}: {
  imageRef: string;
  loggedInUserId: string;
  alt: string;
  className?: string;
}) {
  const imageQuery = useInspectionImage(loggedInUserId, imageRef);
  const objectUrl = useObjectUrl(imageQuery.data);

  if (imageQuery.isError || (!imageQuery.isPending && !imageQuery.data)) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-lg bg-muted text-muted-foreground ${className}`}
        role="img"
        aria-label={`${alt} unavailable`}
      >
        <ImageOff className="size-5" aria-hidden="true" />
      </span>
    );
  }
  if (!objectUrl) {
    return (
      <span
        className={`inline-block animate-pulse rounded-lg bg-muted ${className}`}
        aria-hidden="true"
      />
    );
  }
  return (
    <img
      src={objectUrl}
      alt={alt}
      className={`rounded-lg object-cover ${className}`}
    />
  );
}
