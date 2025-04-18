import { useCallback, useState } from "react";
import { Message } from "../types";

export function useSharingOptions() {
  const [isCopying, setIsCopying] = useState(false);

  // Copy image or video URL to clipboard
  const copyMediaUrl = useCallback(async (message: Message) => {
    if (!message.public_url) return;
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(message.public_url);
    } catch (error) {
      console.error("Error copying URL to clipboard:", error);
    } finally {
      setIsCopying(false);
    }
  }, []);

  // Copy caption text to clipboard
  const copyCaption = useCallback(async (message: Message) => {
    if (!message.caption) return;
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(message.caption);
    } catch (error) {
      console.error("Error copying caption to clipboard:", error);
    } finally {
      setIsCopying(false);
    }
  }, []);

  // Check if the message has a valid media type for sharing
  const hasShareableMedia = useCallback((message: Message) => {
    return (
      !!message.public_url &&
      (message.mime_type?.startsWith("image/") ||
        message.mime_type?.startsWith("video/"))
    );
  }, []);

  const sharingOptions = [
    {
      label: "Copy Media URL",
      action: copyMediaUrl,
      isAvailable: hasShareableMedia,
    },
    {
      label: "Copy Caption",
      action: copyCaption,
      isAvailable: (message: Message) => !!message.caption,
    },
  ];

  return {
    sharingOptions,
    isCopying,
  };
}
