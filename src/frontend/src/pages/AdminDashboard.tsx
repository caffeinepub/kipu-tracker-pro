import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetAllCases } from '@/hooks/useQueries';
import { Shield, FileText, Clock, TrendingUp } from 'lucide-react';
import type { Case } from '@/backend';
import { TaskType } from '@/backend';

const taskTypeLabels: Record<TaskType, string> = {
    [TaskType.supportEMRTickets]: 'Support EMR Tickets',
    [TaskType.break15]: 'Break - 15',
    [TaskType.break30]: 'Break - 30',
    [TaskType.clientMeeting]: 'Client Meeting',
    [TaskType.clientSideTraining]: 'Client Side Training',
    [TaskType.internalTeamMeeting]: 'Internal Team Meeting',
    [TaskType.pod]: 'POD',
    [TaskType.feedbackReview]: 'Feedback/Review',
    [TaskType.internalTraining]: 'Internal Training (EQX)',
    [TaskType.trainingNewTeamMember]: 'Training - New Team Member',
    [TaskType.trainingFeedbackNewTeamMember]: 'Training Feedback - New Team Member'
};

export default function AdminDashboard() {
    const { data: allCases, isLoading: casesLoading } = useGetAllCases();

    const calculateTeamStats = () => {
        if (!allCases || allCases.length === 0) {
            return { totalCases: 0, totalMinutes: 0, avgCaseTime: 0 };
        }

        const totalMinutes = allCases.reduce((sum: number, c: Case) => {
            const duration = Number(c.endTime - c.startTime) / 1_000_000 / 60000;
            return sum + duration;
        }, 0);

        return {
            totalCases: allCases.length,
            totalMinutes: Math.round(totalMinutes),
            avgCaseTime: allCases.length > 0 ? Math.round(totalMinutes / allCases.length) : 0
        };
    };

    const stats = calculateTeamStats();

    const statCards = [
        {
            title: 'Total Cases',
            value: stats.totalCases,
            icon: Shield,
            color: 'text-chart-1'
        },
        {
            title: 'Total Time',
            value: `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`,
            icon: Clock,
            color: 'text-chart-3'
        },
        {
            title: 'Avg Case Time',
            value: `${stats.avgCaseTime}m`,
            icon: TrendingUp,
            color: 'text-chart-5'
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <Shield className="h-8 w-8 text-chart-1" />
                    Admin Dashboard
                </h1>
                <p className="text-muted-foreground">Team-wide metrics and performance overview</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statCards.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Team Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {casesLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : allCases && allCases.length > 0 ? (
                        <div className="space-y-3">
                            {allCases.slice(-10).reverse().map((caseItem: Case) => {
                                const duration = Math.round(
                                    Number(caseItem.endTime - caseItem.startTime) / 1_000_000 / 60000
                                );
                                const startDate = new Date(Number(caseItem.startTime / BigInt(1_000_000)));
                                return (
                                    <div
                                        key={caseItem.id.toString()}
                                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                                    >
                                        <div>
                                            <div className="font-medium">{caseItem.agentName}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {taskTypeLabels[caseItem.taskType]} • {startDate.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-sm font-semibold">{duration}m</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No team activity yet</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
