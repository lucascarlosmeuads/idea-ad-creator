import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface GeneratedImageData {
  id: string;
  url: string;
  topPhrase: string;
  bottomCTA: string;
  imageDescription: string;
  timestamp: Date;
}

interface ImageAnimationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  image: GeneratedImageData | null;
  onAnimate: (motionPrompt: string, duration: number) => void;
  isAnimating: boolean;
}

export default function ImageAnimationDialog({ 
  isOpen, 
  onClose, 
  image, 
  onAnimate, 
  isAnimating 
}: ImageAnimationDialogProps) {
  const [motionPrompt, setMotionPrompt] = useState('mover suavemente');
  const [duration, setDuration] = useState(5);

  const handleAnimate = () => {
    if (motionPrompt.trim()) {
      onAnimate(motionPrompt, duration);
    }
  };

  const presetMotions = [
    'mover suavemente',
    'zoom in lento',
    'zoom out gradual',
    'parallax sutil',
    'rotação lenta',
    'pulsação suave',
    'câmera orbita',
    'vento nas folhas'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🎬 Animar Imagem</DialogTitle>
          <DialogDescription>
            Transforme sua imagem em um vídeo animado usando Runway ML
          </DialogDescription>
        </DialogHeader>
        
        {image && (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="aspect-square rounded-lg overflow-hidden border border-border">
              <img 
                src={image.url} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Motion Prompt */}
            <div className="space-y-2">
              <Label htmlFor="motion-prompt">Tipo de Movimento</Label>
              <Input
                id="motion-prompt"
                value={motionPrompt}
                onChange={(e) => setMotionPrompt(e.target.value)}
                placeholder="Descreva o movimento desejado..."
              />
            </div>

            {/* Preset Motion Buttons */}
            <div className="space-y-2">
              <Label>Movimentos Predefinidos:</Label>
              <div className="grid grid-cols-2 gap-2">
                {presetMotions.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setMotionPrompt(preset)}
                    className="text-xs"
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (segundos)</Label>
              <Input
                id="duration"
                type="number"
                min="3"
                max="10"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isAnimating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAnimate}
                disabled={!motionPrompt.trim() || isAnimating}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isAnimating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Animando...
                  </>
                ) : (
                  '🎬 Animar'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}