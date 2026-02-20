import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetAllCases } from '@/hooks/useQueries';
import { BarChart3, Download } from 'lucide-react';
import { toast } from 'sonner';
import { TaskType, CaseOrigin, CaseType, AssistanceNeeded, TicketStatus, EscalationTransferType, Department } from '@/backend';

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

const caseOriginLabels: Record<CaseOrigin, string> = {
    [CaseOrigin.chat]: 'Chat',
    [CaseOrigin.email]: 'Email',
    [CaseOrigin.voiceCall]: 'Voice Call'
};

const caseTypeLabels: Record<CaseType, string> = {
    [CaseType.new_]: 'New',
    [CaseType.followup]: 'Followup',
    [CaseType.reassigned]: 'Reassigned'
};

const assistanceLabels: Record<AssistanceNeeded, string> = {
    [AssistanceNeeded.no]: 'No',
    [AssistanceNeeded.equinox]: 'Equinox',
    [AssistanceNeeded.onshore]: 'Onshore'
};

const ticketStatusLabels: Record<TicketStatus, string> = {
    [TicketStatus.onHold]: 'On-Hold',
    [TicketStatus.pending]: 'Pending',
    [TicketStatus.resolved]: 'Resolved',
    [TicketStatus.open]: 'Open',
    [TicketStatus.new_]: 'New',
    [TicketStatus.escalated]: 'Escalated',
    [TicketStatus.transferred]: 'Transferred'
};

const escalationTypeLabels: Record<EscalationTransferType, string> = {
    [EscalationTransferType.na]: 'N/A',
    [EscalationTransferType.transferred]: 'Transferred',
    [EscalationTransferType.escalated]: 'Escalated'
};

const departmentLabels: Record<Department, string> = {
    [Department.csm]: 'CSM',
    [Department.billing]: 'Billing',
    [Department.psa]: 'PSA',
    [Department.clientAdvocates]: 'Client Advocates',
    [Department.mat]: 'MAT',
    [Department.erx]: 'eRX',
    [Department.lab]: 'Lab',
    [Department.sales]: 'Sales',
    [Department.accounting]: 'Accounting',
    [Department.emrSupport]: 'EMR Support',
    [Department.cleanup]: 'Cleanup',
    [Department.cas]: 'CAS',
    [Department.productEnhancement]: 'Product Enhancement',
    [Department.crm]: 'CRM',
    [Department.pdmp]: 'PDMP'
};

export default function Analytics() {
    const { data: cases } = useGetAllCases();

    const calculateAnalytics = () => {
        if (!cases || cases.length === 0) {
            return { byType: {}, totalMinutes: 0, avgDuration: 0 };
        }

        const byType: Record<string, number> = {};
        let totalMinutes = 0;

        cases.forEach((c) => {
            const duration = Number(c.endTime - c.startTime) / 1_000_000 / 60000;
            totalMinutes += duration;
            const label = taskTypeLabels[c.taskType];
            byType[label] = (byType[label] || 0) + duration;
        });

        return {
            byType,
            totalMinutes: Math.round(totalMinutes),
            avgDuration: cases.length > 0 ? Math.round(totalMinutes / cases.length) : 0
        };
    };

    const analytics = calculateAnalytics();

    const handleExport = () => {
        if (!cases || cases.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = [
            'Date',
            'Agent Name',
            'Task Type',
            'Case Origin',
            'EMR Case#',
            'Case Type',
            'Assistance Needed',
            'Ticket Status',
            'Escalation/Transfer Type',
            'Escalation/Transfer Destination',
            'Start Time',
            'End Time',
            'Duration (min)',
            'Notes'
        ];

        const rows = cases.map((c) => {
            const startDate = new Date(Number(c.startTime / BigInt(1_000_000)));
            const endDate = new Date(Number(c.endTime / BigInt(1_000_000)));
            const duration = Math.round(Number(c.endTime - c.startTime) / 1_000_000 / 60000);

            return [
                startDate.toLocaleDateString(),
                c.agentName,
                taskTypeLabels[c.taskType],
                c.caseOrigin ? caseOriginLabels[c.caseOrigin] : '',
                c.emrCaseNumber || '',
                c.caseType ? caseTypeLabels[c.caseType] : '',
                c.assistanceNeeded ? assistanceLabels[c.assistanceNeeded] : '',
                c.ticketStatus ? ticketStatusLabels[c.ticketStatus] : '',
                c.escalationTransferType ? escalationTypeLabels[c.escalationTransferType] : '',
                c.escalationTransferDestination ? departmentLabels[c.escalationTransferDestination] : '',
                startDate.toLocaleTimeString(),
                endDate.toLocaleTimeString(),
                duration.toString(),
                c.notes.replace(/"/g, '""')
            ];
        });

        const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kipu-emr-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Data exported successfully!');
    };

    // Separate break times from work tasks
    const breakTypes = [TaskType.break15, TaskType.break30];
    const workEntries = Object.entries(analytics.byType).filter(([type]) => 
        !type.includes('Break')
    );
    const breakEntries = Object.entries(analytics.byType).filter(([type]) => 
        type.includes('Break')
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Analytics</h1>
                    <p className="text-muted-foreground">Visualize your productivity trends</p>
                </div>
                <Button onClick={handleExport} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{cases?.length || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {Math.floor(analytics.totalMinutes / 60)}h {analytics.totalMinutes % 60}m
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{analytics.avgDuration}m</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-chart-3" />
                        Task Distribution by Type
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {Object.keys(analytics.byType).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No data available yet. Start logging cases to see analytics!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {workEntries.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-sm">Work Tasks</h3>
                                    {workEntries.map(([type, minutes]) => {
                                        const percentage = (minutes / analytics.totalMinutes) * 100;
                                        return (
                                            <div key={type}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium">{type}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {Math.round(minutes)}m ({percentage.toFixed(1)}%)
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-chart-1 to-chart-3 transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            
                            {breakEntries.length > 0 && (
                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="font-semibold text-sm">Break Time</h3>
                                    {breakEntries.map(([type, minutes]) => {
                                        const percentage = (minutes / analytics.totalMinutes) * 100;
                                        return (
                                            <div key={type}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium">{type}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {Math.round(minutes)}m ({percentage.toFixed(1)}%)
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-chart-4 to-chart-5 transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
