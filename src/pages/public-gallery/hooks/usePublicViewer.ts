import { useState, useCallback } from 'react';
import { Message } from '../types/Message';

interface PublicViewerState {
  isOpen: boolean;
  currentGroup: Message[];
  groupIndex: number;
  itemIndex: number;
}

export function usePublicViewer(messageGroups: Message[][] = []) {
  const [state, setState] = useState<PublicViewerState>({
    isOpen: false,
    currentGroup: [],
    groupIndex: -1,
    itemIndex: 0,
  });

  // Open the viewer with a specific message group
  const openViewer = useCallback((group: Message[], initialIndex = 0) => {
    if (!group || group.length === 0) return;
    let groupIndex = -1;
    if (messageGroups.length > 0) {
      for (let i = 0; i < messageGroups.length; i++) {
        if (messageGroups[i].some(item => group.some(g => g.id === item.id))) {
          groupIndex = i;
          break;
        }
      }
    }
    setState({
      isOpen: true,
      currentGroup: group,
      groupIndex: groupIndex >= 0 ? groupIndex : 0,
      itemIndex: initialIndex >= 0 && initialIndex < group.length ? initialIndex : 0,
    });
  }, [messageGroups]);

  // Close the viewer
  const closeViewer = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Navigate to previous group
  const goToPreviousGroup = useCallback(() => {
    if (state.groupIndex <= 0 || !messageGroups.length) return;
    const prevIndex = state.groupIndex - 1;
    const prevGroup = messageGroups[prevIndex];
    if (prevGroup && prevGroup.length > 0) {
      setState({
        isOpen: true,
        currentGroup: prevGroup,
        groupIndex: prevIndex,
        itemIndex: 0,
      });
    }
  }, [state.groupIndex, messageGroups]);

  // Navigate to next group
  const goToNextGroup = useCallback(() => {
    if (state.groupIndex < 0 || state.groupIndex >= messageGroups.length - 1) return;
    const nextIndex = state.groupIndex + 1;
    const nextGroup = messageGroups[nextIndex];
    if (nextGroup && nextGroup.length > 0) {
      setState({
        isOpen: true,
        currentGroup: nextGroup,
        groupIndex: nextIndex,
        itemIndex: 0,
      });
    }
  }, [state.groupIndex, messageGroups]);

  return {
    state,
    openViewer,
    closeViewer,
    goToPreviousGroup,
    goToNextGroup,
  };
}
