import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Coffee } from 'lucide-react';

interface BreakOverlayProps {
    isActive: boolean;
    onEnd: () => void;
}

export default function BreakOverlay({ isActive, onEnd }: BreakOverlayProps) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (!isActive) {
            setSeconds(0);
            return;
        }

        const interval = setInterval(() => {
            setSeconds((s) => s + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive]);

    const formatTime = (secs: number) => {
        const h = Math.floor(secs / 3600)
            .toString()
            .padStart(2, '0');
        const m = Math.floor((secs % 3600) / 60)
            .toString()
            .padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center space-y-8">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-chart-5 rounded-full blur-3xl opacity-20 animate-pulse" />
                        <Coffee className="h-24 w-24 text-chart-5 relative" />
                    </div>
                </div>
                <div>
                    <h2 className="text-4xl font-bold mb-2">On Break</h2>
                    <p className="text-muted-foreground">Take your time, you deserve it!</p>
                </div>
                <div className="text-6xl font-bold font-mono tabular-nums">{formatTime(seconds)}</div>
                <Button onClick={onEnd} size="lg" className="gap-2">
                    Resume Work
                </Button>
            </div>
        </div>
    );
}
