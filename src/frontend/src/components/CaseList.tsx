import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGetAllCases } from '@/hooks/useQueries';
import { Clock, Edit } from 'lucide-react';
import { TaskType, Case } from '@/backend';

interface CaseListProps {
  onEditCase?: (caseData: Case) => void;
}

export default function CaseList({ onEditCase }: CaseListProps) {
  const { data: cases, isLoading } = useGetAllCases();

  const formatTime = (nano: bigint) => {
    const ms = Number(nano / BigInt(1_000_000));
    const date = new Date(ms);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getTaskTypeLabel = (taskType: TaskType): string => {
    const labels: Record<TaskType, string> = {
      [TaskType.supportEMRTickets]: 'Support EMR Tickets',
      [TaskType.break15]: 'Break - 15',
      [TaskType.break30]: 'Break - 30',
      [TaskType.clientMeeting]: 'Client Meeting',
      [TaskType.clientSideTraining]: 'Client Side Training',
      [TaskType.internalTeamMeeting]: 'Internal Team Meeting',
      [TaskType.pod]: 'POD',
      [TaskType.feedbackReview]: 'Feedback/Review',
      [TaskType.internalTraining]: 'Internal Training',
      [TaskType.trainingNewTeamMember]: 'Training - New Team Member',
      [TaskType.trainingFeedbackNewTeamMember]: 'Training Feedback - New Team Member',
    };
    return labels[taskType] || taskType;
  };

  const getTaskTypeBadgeVariant = (taskType: TaskType) => {
    if (taskType === TaskType.break15 || taskType === TaskType.break30) {
      return 'secondary';
    }
    return 'default';
  };

  const getCaseOriginLabel = (origin?: string): string => {
    if (!origin) return '';
    const labels: Record<string, string> = {
      chat: 'Chat',
      email: 'Email',
      voiceCall: 'Voice Call',
    };
    return labels[origin] || origin;
  };

  const getCaseTypeLabel = (caseType?: string): string => {
    if (!caseType) return '';
    const labels: Record<string, string> = {
      new_: 'New',
      followup: 'Followup',
      reassigned: 'Reassigned',
    };
    return labels[caseType] || caseType;
  };

  const getTicketStatusLabel = (status?: string): string => {
    if (!status) return '';
    const labels: Record<string, string> = {
      onHold: 'On-Hold',
      pending: 'Pending',
      resolved: 'Resolved',
      open: 'Open',
      new_: 'New',
      escalated: 'Escalated',
      transferred: 'Transferred',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-chart-2" />
            Recent Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Loading cases...</p>
        </CardContent>
      </Card>
    );
  }

  const recentCases = cases?.slice(-10).reverse() || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-chart-2" />
          Recent Cases
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentCases.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No cases logged yet</p>
        ) : (
          <div className="space-y-3">
            {recentCases.map((c) => {
              const isEMR = c.taskType === TaskType.supportEMRTickets;
              const duration = Number(c.endTime - c.startTime) / 1_000_000 / 60000;

              return (
                <div
                  key={c.id.toString()}
                  className="p-4 border border-border rounded-lg hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{c.agentName}</span>
                        <Badge variant={getTaskTypeBadgeVariant(c.taskType)} className="text-xs">
                          {getTaskTypeLabel(c.taskType)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(duration)} min
                        </span>
                      </div>

                      {isEMR && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          {c.caseOrigin && (
                            <div className="text-muted-foreground">
                              <span className="font-medium">Origin:</span> {getCaseOriginLabel(c.caseOrigin)}
                            </div>
                          )}
                          {c.emrCaseNumber && (
                            <div className="text-muted-foreground">
                              <span className="font-medium">Case#:</span> {c.emrCaseNumber}
                            </div>
                          )}
                          {c.caseType && (
                            <div className="text-muted-foreground">
                              <span className="font-medium">Type:</span> {getCaseTypeLabel(c.caseType)}
                            </div>
                          )}
                          {c.ticketStatus && (
                            <div className="text-muted-foreground">
                              <span className="font-medium">Status:</span> {getTicketStatusLabel(c.ticketStatus)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        {formatTime(c.startTime)} → {formatTime(c.endTime)}
                      </div>

                      {c.notes && (
                        <p className="text-sm text-muted-foreground italic mt-2 line-clamp-2">{c.notes}</p>
                      )}
                    </div>

                    {onEditCase && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditCase(c)}
                        className="shrink-0 hover:bg-accent"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
