# Navigation Bar Videos

This directory contains video files that are displayed in the animated logo based on user selection.

## Required Video Files:

- `alryam.mp4` - For "Al Ryam" car selection
- `rb3.mp4` - For "RB3" car selection  
- `chai.mp4` - For "Chai" car selection
- `khayma.mp4` - For "Khayma" car selection
- `g63.mp4` - For "G63" car selection

## Video Specifications:
- Duration: 7 seconds
- Format: MP4
- Recommended size: Keep file size small for web performance
- Aspect ratio: Should work well in small rectangular container

## How it works:
1. User selects a car in FirstVisitModal
2. Selection is saved to localStorage
3. Brand component loads the corresponding video file
4. Video plays automatically every 5 minutes in the navbar logo