import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useGame } from '../../../../contexts/GameContext';
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
  const events = state.events.filter(
    (e: GameEvent) =>
      e.timestamp >= (mission?.timestamp || 0) && e.timestamp <= (mission?.timestamp || 0) + 3600000 // 1 hour window
  );

  // Calculate total duration
  const duration =
    events.length > 0 ? events[events.length - 1].timestamp - events[0].timestamp : 0;

  // Handle playback controls
  const togglePlayback = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback(
    (time: number) => {
      setCurrentTime(Math.max(0, Math.min(time, duration)));
    },
    [duration]
  );

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
        const newTime = time + 100 * playbackSpeed;
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
  const currentEvents = events.filter(
    (e: GameEvent) => e.timestamp <= events[0].timestamp + currentTime
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-4xl rounded-lg border border-gray-700 bg-gray-900 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Mission Replay</h2>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-gray-800">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Mission Details */}
        <div className="mb-6">
          <div className="mb-2 text-lg text-white">{mission.description}</div>
          <div className="text-sm text-gray-400">
            {new Date(mission.timestamp).toLocaleString()}
          </div>
        </div>

        {/* Replay Visualization */}
        <div className="relative mb-6 h-96 overflow-hidden rounded-lg bg-gray-800/50">
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
                <div className="h-2 w-2 rounded-full bg-teal-400" />
              </div>
            ))}
          </div>

          {/* Event Timeline */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-900/90 to-transparent p-4">
            <div className="mb-4 flex items-center space-x-4">
              {currentEvents.map((event: GameEvent, index: number) => (
                <div
                  key={index}
                  className="h-2 w-2 rounded-full bg-teal-400"
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
              className="rounded-lg p-2 transition-colors hover:bg-gray-800"
            >
              <SkipBack className="h-5 w-5 text-teal-400" />
            </button>
            <button
              onClick={togglePlayback}
              className="rounded-lg p-2 transition-colors hover:bg-gray-800"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-teal-400" />
              ) : (
                <Play className="h-5 w-5 text-teal-400" />
              )}
            </button>
            <button
              onClick={() => handleSeek(duration)}
              className="rounded-lg p-2 transition-colors hover:bg-gray-800"
            >
              <SkipForward className="h-5 w-5 text-teal-400" />
            </button>
          </div>

          {/* Playback Speed */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Speed:</span>
            {[0.5, 1, 2, 4].map(speed => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`rounded px-2 py-1 text-sm ${
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
