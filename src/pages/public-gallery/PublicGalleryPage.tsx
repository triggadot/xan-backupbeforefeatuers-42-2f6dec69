import React, { useState } from 'react';
import { PublicMediaViewer } from './PublicMediaViewer';
import { PublicMediaCard } from './PublicMediaCard';
import { usePublicViewer } from './hooks/usePublicViewer';
import { Message } from './types/Message';

// Dummy data for initial wiring/testing (replace with real data fetching)
const sampleMessages: Message[] = [
  // { id: '1', public_url: '...', ... } // Add sample or fetch from backend
];

const messageGroups = [sampleMessages]; // You can group as needed

export default function PublicGalleryPage() {
  const publicViewer = usePublicViewer(messageGroups);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Public Gallery</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sampleMessages.map((msg, idx) => (
          <PublicMediaCard
            key={msg.id}
            message={msg}
            onClick={() => publicViewer.openViewer([msg], 0)}
          />
        ))}
      </div>
      {publicViewer.state.isOpen && (
        <PublicMediaViewer
          isOpen={publicViewer.state.isOpen}
          onClose={publicViewer.closeViewer}
          currentGroup={publicViewer.state.currentGroup}
          initialIndex={publicViewer.state.itemIndex}
          onPrevious={publicViewer.goToPreviousGroup}
          onNext={publicViewer.goToNextGroup}
        />
      )}
    </div>
  );
}
