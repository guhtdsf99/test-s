import React from 'react';

interface VideoPlayerProps {
  title: string;
  onComplete: () => void;
  thumbnail?: string;
  videoUrl?: string;
  autoplay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  title, 
  onComplete,
  thumbnail = '/placeholder.svg',
  videoUrl,
  autoplay = false
}) => {
  if (!videoUrl) {
    return (
      <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-md overflow-hidden" style={{ backgroundImage: `url(${thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="text-center p-6 bg-black bg-opacity-50 rounded-md">
          <h3 className="font-medium text-lg mb-1 text-white">{title}</h3>
          <p className="text-sm text-white">Video not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-md overflow-hidden">
      <video
        className="w-full h-full"
        controls
        autoPlay={autoplay}
        poster={thumbnail}
        onEnded={onComplete}
        src={videoUrl}
        aria-label={title}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};
