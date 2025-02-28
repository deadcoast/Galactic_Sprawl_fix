import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../../../contexts/GameContext';
import { Play, Pause, SkipBack, SkipForward, X } from 'lucide-react';
import { GameEvent } from '../../../../types/core/GameTypes';

interface MissionReplayProps {
  missionId: string;
  onClose: () => void;
}

export function MissionReplay({ missionId, onClose }: MissionReplayProps) {
  const gameContext = useGame();
  
  // Ensure context is available
  if (!gameContext) {
    return null;
  }
  
  const { state } = gameContext;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Find the mission and related events
  const mission = state.missions.history.find((m: { id: string }) => m.id === missionId);
  const events = state.events.filter((e: GameEvent) => 
    e.timestamp >= (mission?.timestamp || 0) && 
    e.timestamp <= (mission?.timestamp || 0) + 3600000 // 1 hour window
  );

  // Calculate total duration
  const duration = events.length > 0 ? 
    events[events.length - 1].timestamp - events[0].timestamp : 
    0;

  // Handle playback controls
  const togglePlayback = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)));
  }, [duration]);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
  }, []);

  // Update time during playback
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(time => {
        const newTime = time + (100 * playbackSpeed);
        if (newTime >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return newTime;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, duration]);

  if (!mission) {
    return null;
  }

  // Get events up to current time
  const currentEvents = events.filter((e: GameEvent) => 
    e.timestamp <= events[0].timestamp + currentTime
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-4xl w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Mission Replay</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Mission Details */}
        <div className="mb-6">
          <div className="text-lg text-white mb-2">{mission.description}</div>
          <div className="text-sm text-gray-400">
            {new Date(mission.timestamp).toLocaleString()}
          </div>
        </div>

        {/* Replay Visualization */}
        <div className="relative h-96 bg-gray-800/50 rounded-lg mb-6 overflow-hidden">
          {/* Map View */}
          <div className="absolute inset-0">
            {/* Render map with ship paths and events */}
            {currentEvents.map((event, index) => (
              <div
                key={index}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  transition: 'all 0.5s ease-out',
                }}
              >
                <div className="w-2 h-2 bg-teal-400 rounded-full" />
              </div>
            ))}
          </div>

          {/* Event Timeline */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-900/90 to-transparent p-4">
            <div className="flex items-center space-x-4 mb-4">
              {currentEvents.map((event: GameEvent, index: number) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full bg-teal-400"
                  style={{
                    left: `${((event.timestamp - events[0].timestamp) / duration) * 100}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleSeek(0)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <SkipBack className="w-5 h-5 text-teal-400" />
            </button>
            <button
              onClick={togglePlayback}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-teal-400" />
              ) : (
                <Play className="w-5 h-5 text-teal-400" />
              )}
            </button>
            <button
              onClick={() => handleSeek(duration)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <SkipForward className="w-5 h-5 text-teal-400" />
            </button>
          </div>

          {/* Playback Speed */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Speed:</span>
            {[0.5, 1, 2, 4].map(speed => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2 py-1 rounded text-sm ${
                  playbackSpeed === speed
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Progress */}
          <div className="text-sm text-gray-400">
            {Math.floor(currentTime / 1000)}s / {Math.floor(duration / 1000)}s
          </div>
        </div>
      </div>
    </div>
  );
} 