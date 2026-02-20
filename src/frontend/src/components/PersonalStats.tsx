import { Card, CardContent } from '@/components/ui/card';
import { useGetAllCases, useGetCallerUserProfile } from '@/hooks/useQueries';
import { TaskType } from '@/backend';

export default function PersonalStats() {
  const { data: cases } = useGetAllCases();
  const { data: profile } = useGetCallerUserProfile();

  const calculateStats = () => {
    if (!cases || cases.length === 0) {
      return { shiftProgress: 0, utilization: 0, timeLeft: '0h 0m', workTime: '0m' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayNano = BigInt(today.getTime()) * BigInt(1_000_000);

    const todayCases = cases.filter((c) => c.startTime >= todayNano);

    // Calculate total minutes excluding break times
    const totalMinutes = todayCases.reduce((sum, c) => {
      const isBreak = c.taskType === TaskType.break15 || c.taskType === TaskType.break30;
      if (isBreak) return sum;
      const duration = Number(c.endTime - c.startTime) / 1_000_000 / 60000;
      return sum + duration;
    }, 0);

    const shiftPrefs = profile?.shiftPreferences || '09:00-17:00';
    const [start, end] = shiftPrefs.split('-');
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const shiftMinutes = endH * 60 + endM - (startH * 60 + startM);

    const shiftProgress = shiftMinutes > 0 ? Math.min((totalMinutes / shiftMinutes) * 100, 100) : 0;
    const utilization = shiftMinutes > 0 ? (totalMinutes / shiftMinutes) * 100 : 0;
    
    const remainingMinutes = Math.max(0, shiftMinutes - totalMinutes);
    const timeLeftHours = Math.floor(remainingMinutes / 60);
    const timeLeftMins = Math.round(remainingMinutes % 60);

    return {
      shiftProgress: Math.round(shiftProgress),
      utilization: Math.round(utilization * 10) / 10,
      timeLeft: `${timeLeftHours}h ${timeLeftMins}m`,
      workTime: `${Math.floor(totalMinutes / 60)}h ${Math.round(totalMinutes % 60)}m`,
    };
  };

  const stats = calculateStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-border transition-all">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full badge-green-gradient flex items-center justify-center shrink-0">
              <div className="text-white text-lg font-bold">{stats.shiftProgress}%</div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">SHIFT PROGRESS</div>
              <div className="text-3xl font-bold text-foreground">{stats.shiftProgress}%</div>
              <div className="text-sm text-muted-foreground mt-1">{stats.timeLeft} Left</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-border transition-all">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full badge-blue-gradient flex items-center justify-center shrink-0">
              <div className="text-white text-lg font-bold">{stats.utilization}%</div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">UTILIZATION</div>
              <div className="text-3xl font-bold text-foreground">{stats.utilization}%</div>
              <div className="text-sm text-muted-foreground mt-1">{stats.workTime} / 102m</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
