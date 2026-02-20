import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetAllCases, useGetCallerUserProfile } from '@/hooks/useQueries';
import { TrendingUp, Clock, Target, Zap } from 'lucide-react';
import { TaskType } from '@/backend';

export default function PersonalStats() {
  const { data: cases } = useGetAllCases();
  const { data: profile } = useGetCallerUserProfile();

  const calculateStats = () => {
    if (!cases || cases.length === 0) {
      return { totalCases: 0, totalMinutes: 0, utilization: 0, avgCaseTime: 0 };
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

    // Allow utilization to exceed 100% for multi-tasking scenarios
    const utilization = shiftMinutes > 0 ? (totalMinutes / shiftMinutes) * 100 : 0;
    const workCases = todayCases.filter((c) => c.taskType !== TaskType.break15 && c.taskType !== TaskType.break30);
    const avgCaseTime = workCases.length > 0 ? totalMinutes / workCases.length : 0;

    return {
      totalCases: todayCases.length,
      totalMinutes: Math.round(totalMinutes),
      utilization: Math.round(utilization),
      avgCaseTime: Math.round(avgCaseTime),
    };
  };

  const stats = calculateStats();

  const statCards = [
    {
      title: 'Cases Today',
      value: stats.totalCases,
      icon: Target,
      color: 'text-chart-1',
    },
    {
      title: 'Active Time',
      value: `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`,
      icon: Clock,
      color: 'text-chart-2',
    },
    {
      title: 'Utilization',
      value: `${stats.utilization}%`,
      subtitle: stats.utilization > 100 ? 'Multi-tasking' : undefined,
      icon: TrendingUp,
      color: stats.utilization > 100 ? 'text-chart-4' : 'text-chart-3',
    },
    {
      title: 'Avg Case Time',
      value: `${stats.avgCaseTime}m`,
      icon: Zap,
      color: 'text-chart-5',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {statCards.map((stat) => (
        <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-200 border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
            {stat.subtitle && <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
