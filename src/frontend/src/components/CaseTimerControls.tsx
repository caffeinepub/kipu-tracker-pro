import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Play, Square, Coffee, Clock } from 'lucide-react';
import { useCreateCase } from '@/hooks/useQueries';
import { toast } from 'sonner';
import {
  TaskType,
  CaseOrigin,
  CaseType,
  AssistanceNeeded,
  TicketStatus,
  EscalationTransferType,
  Department,
} from '@/backend';
import { dateTimeLocalToNano, validateTimeRange, dateToDateTimeLocal } from '@/utils/timeHelpers';

interface CaseTimerControlsProps {
  onBreakStart?: () => void;
}

export default function CaseTimerControls({ onBreakStart }: CaseTimerControlsProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [manualMode, setManualMode] = useState(false);

  // Basic fields
  const [agentName, setAgentName] = useState('');
  const [taskType, setTaskType] = useState<TaskType>(TaskType.supportEMRTickets);
  const [notes, setNotes] = useState('');

  // Manual time entry fields
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');

  // EMR-specific fields (conditional)
  const [caseOrigin, setCaseOrigin] = useState<CaseOrigin | ''>('');
  const [emrCaseNumber, setEmrCaseNumber] = useState('');
  const [caseType, setCaseType] = useState<CaseType | ''>('');
  const [assistanceNeeded, setAssistanceNeeded] = useState<AssistanceNeeded | ''>('');
  const [ticketStatus, setTicketStatus] = useState<TicketStatus | ''>('');
  const [escalationTransferType, setEscalationTransferType] = useState<EscalationTransferType | ''>('');
  const [escalationTransferDestination, setEscalationTransferDestination] = useState<Department | ''>('');

  const createCase = useCreateCase();

  const isEMRTicket = taskType === TaskType.supportEMRTickets;
  const showDestination =
    escalationTransferType === EscalationTransferType.escalated ||
    escalationTransferType === EscalationTransferType.transferred;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleStart = () => {
    if (!agentName.trim()) {
      toast.error('Please enter agent name');
      return;
    }
    setIsRunning(true);
    setStartTime(Date.now());
    setElapsedSeconds(0);
  };

  const handleStop = async () => {
    if (!startTime) return;

    // Validation for EMR tickets
    if (isEMRTicket) {
      if (!caseType) {
        toast.error('Case Type is required for EMR tickets');
        return;
      }
      if (!assistanceNeeded) {
        toast.error('Assistance Needed is required for EMR tickets');
        return;
      }
      if (!ticketStatus) {
        toast.error('Ticket Case Status is required for EMR tickets');
        return;
      }
      if (!escalationTransferType) {
        toast.error('Escalation/Transfer classification is required for EMR tickets');
        return;
      }
      if (showDestination && !escalationTransferDestination) {
        toast.error('Please select escalation/transfer destination');
        return;
      }
    }

    const endTime = Date.now();
    const startNano = BigInt(startTime) * BigInt(1_000_000);
    const endNano = BigInt(endTime) * BigInt(1_000_000);

    try {
      await createCase.mutateAsync({
        agentName: agentName.trim(),
        taskType,
        caseOrigin: isEMRTicket && caseOrigin ? caseOrigin : null,
        emrCaseNumber: isEMRTicket && emrCaseNumber ? emrCaseNumber : null,
        caseType: isEMRTicket && caseType ? caseType : null,
        assistanceNeeded: isEMRTicket && assistanceNeeded ? assistanceNeeded : null,
        ticketStatus: isEMRTicket && ticketStatus ? ticketStatus : null,
        escalationTransferType: isEMRTicket && escalationTransferType ? escalationTransferType : null,
        escalationTransferDestination:
          isEMRTicket && showDestination && escalationTransferDestination ? escalationTransferDestination : null,
        start: startNano,
        end: endNano,
        notes: notes || '',
      });

      toast.success('Case logged successfully!');
      resetForm();
    } catch (error: any) {
      if (error.message?.includes('conflict')) {
        toast.error('Time conflict detected! This overlaps with an existing case.');
      } else {
        toast.error('Failed to log case');
      }
      console.error(error);
    }
  };

  const handleManualSubmit = async () => {
    if (!agentName.trim()) {
      toast.error('Please enter agent name');
      return;
    }

    if (!manualStartTime || !manualEndTime) {
      toast.error('Start and end times are required');
      return;
    }

    if (!validateTimeRange(manualStartTime, manualEndTime)) {
      toast.error('End time must be after start time');
      return;
    }

    // Validation for EMR tickets
    if (isEMRTicket) {
      if (!caseType) {
        toast.error('Case Type is required for EMR tickets');
        return;
      }
      if (!assistanceNeeded) {
        toast.error('Assistance Needed is required for EMR tickets');
        return;
      }
      if (!ticketStatus) {
        toast.error('Ticket Case Status is required for EMR tickets');
        return;
      }
      if (!escalationTransferType) {
        toast.error('Escalation/Transfer classification is required for EMR tickets');
        return;
      }
      if (showDestination && !escalationTransferDestination) {
        toast.error('Please select escalation/transfer destination');
        return;
      }
    }

    try {
      await createCase.mutateAsync({
        agentName: agentName.trim(),
        taskType,
        caseOrigin: isEMRTicket && caseOrigin ? caseOrigin : null,
        emrCaseNumber: isEMRTicket && emrCaseNumber ? emrCaseNumber : null,
        caseType: isEMRTicket && caseType ? caseType : null,
        assistanceNeeded: isEMRTicket && assistanceNeeded ? assistanceNeeded : null,
        ticketStatus: isEMRTicket && ticketStatus ? ticketStatus : null,
        escalationTransferType: isEMRTicket && escalationTransferType ? escalationTransferType : null,
        escalationTransferDestination:
          isEMRTicket && showDestination && escalationTransferDestination ? escalationTransferDestination : null,
        start: dateTimeLocalToNano(manualStartTime),
        end: dateTimeLocalToNano(manualEndTime),
        notes: notes || '',
      });

      toast.success('Case logged successfully!');
      resetForm();
    } catch (error: any) {
      if (error.message?.includes('conflict')) {
        toast.error('Time conflict detected! This overlaps with an existing case.');
      } else {
        toast.error('Failed to log case');
      }
      console.error(error);
    }
  };

  const resetForm = () => {
    setIsRunning(false);
    setStartTime(null);
    setElapsedSeconds(0);
    setNotes('');
    setManualStartTime('');
    setManualEndTime('');
    // Reset EMR fields
    setCaseOrigin('');
    setEmrCaseNumber('');
    setCaseType('');
    setAssistanceNeeded('');
    setTicketStatus('');
    setEscalationTransferType('');
    setEscalationTransferDestination('');
  };

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5 text-chart-1" />
          Live Case Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="manual-mode" className="text-sm font-medium cursor-pointer">
              Manual Time Entry
            </Label>
          </div>
          <Switch
            id="manual-mode"
            checked={manualMode}
            onCheckedChange={(checked) => {
              setManualMode(checked);
              if (checked && !manualStartTime) {
                const now = new Date();
                setManualStartTime(dateToDateTimeLocal(now));
              }
            }}
            disabled={isRunning}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agentName">Agent Name</Label>
          <Input
            id="agentName"
            placeholder="Enter your name"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            disabled={isRunning}
            className="border-2 focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="taskType">Task Type</Label>
          <Select value={taskType} onValueChange={(v) => setTaskType(v as TaskType)} disabled={isRunning}>
            <SelectTrigger id="taskType" className="border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TaskType.supportEMRTickets}>Support EMR Tickets</SelectItem>
              <SelectItem value={TaskType.break15}>Break - 15</SelectItem>
              <SelectItem value={TaskType.break30}>Break - 30</SelectItem>
              <SelectItem value={TaskType.clientMeeting}>Client Meeting</SelectItem>
              <SelectItem value={TaskType.clientSideTraining}>Client Side Training</SelectItem>
              <SelectItem value={TaskType.internalTeamMeeting}>Internal Team Meeting</SelectItem>
              <SelectItem value={TaskType.pod}>POD</SelectItem>
              <SelectItem value={TaskType.feedbackReview}>Feedback/Review</SelectItem>
              <SelectItem value={TaskType.internalTraining}>Internal Training (Conducted by EQX)</SelectItem>
              <SelectItem value={TaskType.trainingNewTeamMember}>Training - New Team Member</SelectItem>
              <SelectItem value={TaskType.trainingFeedbackNewTeamMember}>
                Training Feedback - New Team Member
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {manualMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-accent/30 rounded-lg border-2 border-dashed">
            <div className="space-y-2">
              <Label htmlFor="manualStartTime">Start Time</Label>
              <Input
                id="manualStartTime"
                type="datetime-local"
                value={manualStartTime}
                onChange={(e) => setManualStartTime(e.target.value)}
                className="border-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manualEndTime">End Time</Label>
              <Input
                id="manualEndTime"
                type="datetime-local"
                value={manualEndTime}
                onChange={(e) => setManualEndTime(e.target.value)}
                className="border-2"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-6 bg-gradient-to-br from-primary/10 to-chart-2/10 rounded-xl border-2">
            <div className="text-center">
              <div className="text-5xl font-bold font-mono text-primary mb-2">{formatTime(elapsedSeconds)}</div>
              <div className="text-sm text-muted-foreground">
                {isRunning ? 'Timer Running' : 'Ready to Start'}
              </div>
            </div>
          </div>
        )}

        {isEMRTicket && (
          <div className="border-t-2 pt-5 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-primary">
              <span className="h-1 w-1 rounded-full bg-primary"></span>
              Case Classification – EMR
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caseOrigin">Case Origin</Label>
                <Select value={caseOrigin} onValueChange={(v) => setCaseOrigin(v as CaseOrigin)} disabled={isRunning}>
                  <SelectTrigger id="caseOrigin">
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CaseOrigin.chat}>Chat</SelectItem>
                    <SelectItem value={CaseOrigin.email}>Email</SelectItem>
                    <SelectItem value={CaseOrigin.voiceCall}>Voice Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emrCaseNumber">EMR Case#</Label>
                <Input
                  id="emrCaseNumber"
                  placeholder="Enter case number"
                  value={emrCaseNumber}
                  onChange={(e) => setEmrCaseNumber(e.target.value)}
                  disabled={isRunning}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseType">
                Case Type <span className="text-destructive">*</span>
              </Label>
              <Select value={caseType} onValueChange={(v) => setCaseType(v as CaseType)} disabled={isRunning}>
                <SelectTrigger id="caseType">
                  <SelectValue placeholder="Select case type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CaseType.new_}>New</SelectItem>
                  <SelectItem value={CaseType.followup}>Followup</SelectItem>
                  <SelectItem value={CaseType.reassigned}>Reassigned</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                New: fresh ticket | Followup: previous day reopen | Reassigned: from another agent
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assistanceNeeded">
                Assistance Needed <span className="text-destructive">*</span>
              </Label>
              <Select
                value={assistanceNeeded}
                onValueChange={(v) => setAssistanceNeeded(v as AssistanceNeeded)}
                disabled={isRunning}
              >
                <SelectTrigger id="assistanceNeeded">
                  <SelectValue placeholder="Select assistance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AssistanceNeeded.no}>No</SelectItem>
                  <SelectItem value={AssistanceNeeded.equinox}>Equinox</SelectItem>
                  <SelectItem value={AssistanceNeeded.onshore}>Onshore</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Equinox: EQX leads help | Onshore: Zendesk Macro | No: followup with existing help
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketStatus">
                Ticket Case Status <span className="text-destructive">*</span>
              </Label>
              <Select value={ticketStatus} onValueChange={(v) => setTicketStatus(v as TicketStatus)} disabled={isRunning}>
                <SelectTrigger id="ticketStatus">
                  <SelectValue placeholder="Select final status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TicketStatus.onHold}>On-Hold</SelectItem>
                  <SelectItem value={TicketStatus.pending}>Pending</SelectItem>
                  <SelectItem value={TicketStatus.resolved}>Resolved</SelectItem>
                  <SelectItem value={TicketStatus.open}>Open</SelectItem>
                  <SelectItem value={TicketStatus.new_}>New</SelectItem>
                  <SelectItem value={TicketStatus.escalated}>Escalated</SelectItem>
                  <SelectItem value={TicketStatus.transferred}>Transferred</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Select the final status after working on the ticket</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="escalationTransferType">
                Ticket ESCALATED or TRANSFERRED <span className="text-destructive">*</span>
              </Label>
              <Select
                value={escalationTransferType}
                onValueChange={(v) => setEscalationTransferType(v as EscalationTransferType)}
                disabled={isRunning}
              >
                <SelectTrigger id="escalationTransferType">
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EscalationTransferType.na}>N/A</SelectItem>
                  <SelectItem value={EscalationTransferType.transferred}>Transferred</SelectItem>
                  <SelectItem value={EscalationTransferType.escalated}>Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showDestination && (
              <div className="space-y-2">
                <Label htmlFor="escalationTransferDestination">
                  Destination Department <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={escalationTransferDestination}
                  onValueChange={(v) => setEscalationTransferDestination(v as Department)}
                  disabled={isRunning}
                >
                  <SelectTrigger id="escalationTransferDestination">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Department.csm}>CSM</SelectItem>
                    <SelectItem value={Department.billing}>Billing</SelectItem>
                    <SelectItem value={Department.psa}>PSA</SelectItem>
                    <SelectItem value={Department.clientAdvocates}>Client Advocates</SelectItem>
                    <SelectItem value={Department.mat}>MAT</SelectItem>
                    <SelectItem value={Department.erx}>eRx</SelectItem>
                    <SelectItem value={Department.lab}>Lab</SelectItem>
                    <SelectItem value={Department.sales}>Sales</SelectItem>
                    <SelectItem value={Department.accounting}>Accounting</SelectItem>
                    <SelectItem value={Department.emrSupport}>EMR Support</SelectItem>
                    <SelectItem value={Department.cleanup}>Cleanup</SelectItem>
                    <SelectItem value={Department.cas}>CAS</SelectItem>
                    <SelectItem value={Department.productEnhancement}>Product Enhancement</SelectItem>
                    <SelectItem value={Department.crm}>CRM</SelectItem>
                    <SelectItem value={Department.pdmp}>PDMP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            disabled={isRunning}
            className="border-2 focus:border-primary"
          />
        </div>

        <div className="flex gap-3 pt-2">
          {manualMode ? (
            <Button onClick={handleManualSubmit} disabled={createCase.isPending} className="flex-1 h-12 text-base font-semibold shadow-md">
              {createCase.isPending ? 'Logging...' : 'Log Case'}
            </Button>
          ) : (
            <>
              {!isRunning ? (
                <Button onClick={handleStart} className="flex-1 h-12 text-base font-semibold shadow-md">
                  <Play className="mr-2 h-5 w-5" />
                  Start Timer
                </Button>
              ) : (
                <Button
                  onClick={handleStop}
                  variant="destructive"
                  disabled={createCase.isPending}
                  className="flex-1 h-12 text-base font-semibold shadow-md"
                >
                  <Square className="mr-2 h-5 w-5" />
                  {createCase.isPending ? 'Logging...' : 'Stop & Log'}
                </Button>
              )}
            </>
          )}

          {onBreakStart && (
            <Button
              onClick={onBreakStart}
              variant="outline"
              disabled={isRunning}
              className="h-12 px-6 border-2 shadow-md"
            >
              <Coffee className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
