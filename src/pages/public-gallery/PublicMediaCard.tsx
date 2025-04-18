import { Message } from "./types";
import { isVideoMessage } from "./utils/mediaUtils";

interface PublicMediaCardProps {
  message: Message;
  onClick: (message: Message) => void;
  className?: string;
}

// Format video duration as mm:ss
function formatDuration(seconds?: number): string {
  if (!seconds) return "";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function PublicMediaCard({
  message,
  onClick,
  className,
}: PublicMediaCardProps) {
  const isVideo = isVideoMessage(message);

  return (
    <div
      className={`rounded-lg border bg-background shadow hover:shadow-lg cursor-pointer overflow-hidden ${className || ""}`}
      onClick={() => onClick(message)}
    >
      {isVideo ? (
        <div className="relative w-full aspect-video bg-black">
          <video
            src={message.public_url}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
            style={{ pointerEvents: "none" }}
          />
          {message.duration && (
            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
              {formatDuration(message.duration)}
            </span>
          )}
        </div>
      ) : (
        <img
          src={message.public_url}
          alt={
            message.analyzed_content?.product_name || message.caption || "Media"
          }
          className="w-full aspect-square object-cover bg-muted"
        />
      )}
      <div className="p-2">
        <div
          className="font-medium truncate"
          title={
            message.analyzed_content?.product_name || message.caption || ""
          }
        >
          {message.analyzed_content?.product_name ||
            message.caption ||
            "Untitled"}
        </div>
        {message.analyzed_content?.vendor_uid && (
          <div className="text-xs text-muted-foreground mt-1">
            Vendor: {message.analyzed_content.vendor_uid}
          </div>
        )}
      </div>
    </div>
  );
}
