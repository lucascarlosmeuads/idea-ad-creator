import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  FileAudio,
  Loader2,
  Volume2,
  Languages
} from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { TranscriptionService } from '@/services/transcription';
import { ApiConfigManager } from '@/services/apiConfig';
import { toast } from 'sonner';

interface AudioRecorderPanelProps {
  onTranscriptionComplete?: (text: string) => void;
}

export default function AudioRecorderPanel({ onTranscriptionComplete }: AudioRecorderPanelProps) {
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('pt');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState('');
  const [transcribedText, setTranscribedText] = useState('');

  const {
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
  } = useAudioRecorder();

  const apiManager = ApiConfigManager.getInstance();

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const transcribeAudio = async () => {
    if (!recordedBlob) {
      toast.error('Nenhum áudio gravado para transcrever');
      return;
    }

    const openaiKey = apiManager.getApiKey('openai');
    if (!openaiKey) {
      toast.error('Configure a chave API OpenAI primeiro');
      return;
    }

    setIsTranscribing(true);
    setTranscriptionProgress('');

    try {
      const transcriptionService = new TranscriptionService(openaiKey);
      
      const result = await transcriptionService.transcribeWithProgress(
        recordedBlob,
        {
          language: transcriptionLanguage,
          response_format: 'verbose_json',
          temperature: 0.2
        },
        (status) => {
          setTranscriptionProgress(status);
        }
      );

      setTranscribedText(result.text);
      onTranscriptionComplete?.(result.text);
      
      toast.success('Transcrição concluída com sucesso!');
    } catch (error) {
      console.error('Erro na transcrição:', error);
      toast.error('Erro ao transcrever áudio. Verifique sua chave API.');
    } finally {
      setIsTranscribing(false);
      setTranscriptionProgress('');
    }
  };

  const supportedLanguages = [
    { code: 'pt', name: 'Português' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' }
  ];

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          🎤 Gravação de Áudio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Controls */}
        <div className="text-center space-y-4">
          {/* Duration Display */}
          <div className="text-2xl font-mono font-bold text-primary">
            {formatDuration(duration)}
          </div>

          {/* Recording Status */}
          <div className="flex justify-center">
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                <div className="h-2 w-2 rounded-full bg-white mr-2" />
                Gravando...
              </Badge>
            )}
            {recordedBlob && !isRecording && (
              <Badge variant="secondary">
                <FileAudio className="h-3 w-3 mr-1" />
                Áudio gravado ({formatDuration(duration)})
              </Badge>
            )}
          </div>

          {/* Main Controls */}
          <div className="flex justify-center gap-3">
            {!isRecording && !recordedBlob && (
              <Button
                onClick={startRecording}
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16"
              >
                <Mic className="h-6 w-6" />
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="outline"
                className="rounded-full w-16 h-16"
              >
                <Square className="h-6 w-6" />
              </Button>
            )}

            {recordedBlob && !isRecording && (
              <>
                <Button
                  onClick={isPlaying ? pausePlayback : playRecording}
                  size="lg"
                  variant="outline"
                  className="rounded-full w-12 h-12"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                <Button
                  onClick={resetRecording}
                  size="lg"
                  variant="outline"
                  className="rounded-full w-12 h-12"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Transcription Section */}
        {recordedBlob && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                <Label className="font-medium">Idioma da Transcrição</Label>
              </div>
              
              <Select value={transcriptionLanguage} onValueChange={setTranscriptionLanguage}>
                <SelectTrigger className="bg-background/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={transcribeAudio}
                disabled={isTranscribing || !apiManager.hasApiKey('openai')}
                className="w-full"
                variant="gradient"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {transcriptionProgress || 'Transcrevendo...'}
                  </>
                ) : (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    🔤 Transcrever Áudio
                  </>
                )}
              </Button>

              {!apiManager.hasApiKey('openai') && (
                <p className="text-sm text-muted-foreground text-center">
                  Configure a chave API OpenAI para usar a transcrição
                </p>
              )}
            </div>
          </>
        )}

        {/* Transcription Result */}
        {transcribedText && (
          <>
            <Separator />
            
            <div className="space-y-2">
              <Label className="font-medium">📝 Texto Transcrito:</Label>
              <div className="bg-secondary/20 p-4 rounded-lg border border-border">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {transcribedText}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                ✅ Transcrição aplicada automaticamente ao documento
              </p>
            </div>
          </>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>Dica:</strong> Fale claramente sobre seu negócio, produto, público-alvo e problemas que resolve. 
            O áudio será transcrito e usado para análise automática.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}