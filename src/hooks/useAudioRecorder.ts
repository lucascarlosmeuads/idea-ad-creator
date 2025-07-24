import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export interface AudioRecorderState {
  isRecording: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  recordedBlob: Blob | null;
  recordedUrl: string | null;
  duration: number;
  error: string | null;
}

export interface AudioRecorderActions {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  playRecording: () => void;
  pausePlayback: () => void;
  resetRecording: () => void;
}

export function useAudioRecorder(): AudioRecorderState & AudioRecorderActions {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setRecordedBlob(blob);
        
        // Create URL for playback
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        
        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      toast.success('Gravação iniciada');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao acessar microfone';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast.success('Gravação finalizada');
    }
  }, [isRecording]);

  const playRecording = useCallback(() => {
    if (recordedUrl && !isPlaying) {
      if (!audioRef.current) {
        audioRef.current = new Audio(recordedUrl);
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          setIsPaused(false);
        };
        
        audioRef.current.onerror = () => {
          setError('Erro ao reproduzir áudio');
          setIsPlaying(false);
          setIsPaused(false);
        };
      }
      
      if (isPaused) {
        audioRef.current.play();
        setIsPaused(false);
      } else {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      
      setIsPlaying(true);
    }
  }, [recordedUrl, isPlaying, isPaused]);

  const pausePlayback = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  }, [isPlaying]);

  const resetRecording = useCallback(() => {
    // Stop any ongoing recording
    if (isRecording) {
      stopRecording();
    }
    
    // Stop any playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Revoke URL
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    
    // Reset state
    setIsRecording(false);
    setIsPlaying(false);
    setIsPaused(false);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    setError(null);
  }, [isRecording, recordedUrl, stopRecording]);

  return {
    isRecording,
    isPlaying,
    isPaused,
    recordedBlob,
    recordedUrl,
    duration,
    error,
    startRecording,
    stopRecording,
    playRecording,
    pausePlayback,
    resetRecording
  };
}