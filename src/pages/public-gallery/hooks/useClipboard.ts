import { useState } from 'react';

export function useClipboard() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    if (!navigator.clipboard) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        setIsCopied(successful);
        return successful;
      } catch (err) {
        console.error('Fallback: Could not copy text: ', err);
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      return true;
    } catch (err) {
      console.error('Could not copy text: ', err);
      return false;
    }
  };

  return {
    isCopied,
    copyToClipboard,
    resetCopiedState: () => setIsCopied(false),
  };
}
