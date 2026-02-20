import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetAllCases } from '@/hooks/useQueries';
import { Edit } from 'lucide-react';
import { TaskType, Case } from '@/backend';

interface CaseListProps {
  onEditCase?: (caseData: Case) => void;
}

export default function CaseList({ onEditCase }: CaseListProps) {
  const { data: cases, isLoading } = useGetAllCases();

  const formatDuration = (nano: bigint, endNano: bigint) => {
    const duration = Number(endNano - nano) / 1_000_000 / 60000;
    const hours = Math.floor(duration / 60);
    const mins = Math.round(duration % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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

  const getCaseTypeLabel = (caseType?: string): string => {
    if (!caseType) return '';
    const labels: Record<string, string> = {
      new_: 'New',
      followup: 'Followup',
      reassigned: 'Reassigned',
    };
    return labels[caseType] || caseType;
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center py-8">Loading cases...</p>
        </CardContent>
      </Card>
    );
  }

  const recentCases = cases?.slice(-10).reverse() || [];

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardContent className="p-0">
        {recentCases.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No cases logged yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium text-xs uppercase">Task</TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs uppercase">Case</TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs uppercase">Case Type</TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs uppercase">Dur</TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs uppercase">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCases.map((c) => (
                <TableRow key={c.id.toString()} className="border-border/50 hover:bg-accent/30">
                  <TableCell className="text-foreground">{getTaskTypeLabel(c.taskType)}</TableCell>
                  <TableCell className="text-foreground">{c.emrCaseNumber || '-'}</TableCell>
                  <TableCell className="text-foreground">{getCaseTypeLabel(c.caseType) || '-'}</TableCell>
                  <TableCell className="text-foreground">{formatDuration(c.startTime, c.endTime)}</TableCell>
                  <TableCell>
                    {onEditCase && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditCase(c)}
                        className="hover:bg-accent/50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
