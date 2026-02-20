import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEditCase } from '@/hooks/useQueries';
import { toast } from 'sonner';
import {
  Case,
  TaskType,
  CaseOrigin,
  CaseType,
  AssistanceNeeded,
  TicketStatus,
  EscalationTransferType,
  Department,
} from '@/backend';
import { nanoToDateTimeLocal, dateTimeLocalToNano, validateTimeRange } from '@/utils/timeHelpers';

interface EditCaseModalProps {
  case: Case | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditCaseModal({ case: caseData, open, onOpenChange }: EditCaseModalProps) {
  const [agentName, setAgentName] = useState('');
  const [taskType, setTaskType] = useState<TaskType>(TaskType.supportEMRTickets);
  const [caseOrigin, setCaseOrigin] = useState<CaseOrigin | ''>('');
  const [emrCaseNumber, setEmrCaseNumber] = useState('');
  const [caseType, setCaseType] = useState<CaseType | ''>('');
  const [assistanceNeeded, setAssistanceNeeded] = useState<AssistanceNeeded | ''>('');
  const [ticketStatus, setTicketStatus] = useState<TicketStatus | ''>('');
  const [escalationTransferType, setEscalationTransferType] = useState<EscalationTransferType | ''>('');
  const [escalationTransferDestination, setEscalationTransferDestination] = useState<Department | ''>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');

  const editCase = useEditCase();

  const isEMRTicket = taskType === TaskType.supportEMRTickets;
  const showDestination =
    escalationTransferType === EscalationTransferType.escalated ||
    escalationTransferType === EscalationTransferType.transferred;

  useEffect(() => {
    if (caseData && open) {
      setAgentName(caseData.agentName);
      setTaskType(caseData.taskType);
      setCaseOrigin(caseData.caseOrigin || '');
      setEmrCaseNumber(caseData.emrCaseNumber || '');
      setCaseType(caseData.caseType || '');
      setAssistanceNeeded(caseData.assistanceNeeded || '');
      setTicketStatus(caseData.ticketStatus || '');
      setEscalationTransferType(caseData.escalationTransferType || '');
      setEscalationTransferDestination(caseData.escalationTransferDestination || '');
      setStartTime(nanoToDateTimeLocal(caseData.startTime));
      setEndTime(nanoToDateTimeLocal(caseData.endTime));
      setNotes(caseData.notes);
    }
  }, [caseData, open]);

  const handleSave = async () => {
    if (!caseData) return;

    if (!agentName.trim()) {
      toast.error('Agent name is required');
      return;
    }

    if (!startTime || !endTime) {
      toast.error('Start and end times are required');
      return;
    }

    if (!validateTimeRange(startTime, endTime)) {
      toast.error('End time must be after start time');
      return;
    }

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
      await editCase.mutateAsync({
        caseId: caseData.id,
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
        start: dateTimeLocalToNano(startTime),
        end: dateTimeLocalToNano(endTime),
        notes: notes || '',
      });

      toast.success('Case updated successfully!');
      onOpenChange(false);
    } catch (error: any) {
      if (error.message?.includes('conflict')) {
        toast.error('Time conflict detected! This overlaps with an existing case.');
      } else {
        toast.error('Failed to update case');
      }
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Case</DialogTitle>
          <DialogDescription>Update case details and save changes</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-agentName">Agent Name</Label>
            <Input
              id="edit-agentName"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Enter agent name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-taskType">Task Type</Label>
            <Select value={taskType} onValueChange={(v) => setTaskType(v as TaskType)}>
              <SelectTrigger id="edit-taskType">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-startTime">Start Time</Label>
              <Input
                id="edit-startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-endTime">End Time</Label>
              <Input
                id="edit-endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {isEMRTicket && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold text-sm">Case Classification – EMR</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-caseOrigin">Case Origin</Label>
                  <Select value={caseOrigin} onValueChange={(v) => setCaseOrigin(v as CaseOrigin)}>
                    <SelectTrigger id="edit-caseOrigin">
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
                  <Label htmlFor="edit-emrCaseNumber">EMR Case#</Label>
                  <Input
                    id="edit-emrCaseNumber"
                    value={emrCaseNumber}
                    onChange={(e) => setEmrCaseNumber(e.target.value)}
                    placeholder="Enter case number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-caseType">Case Type *</Label>
                <Select value={caseType} onValueChange={(v) => setCaseType(v as CaseType)}>
                  <SelectTrigger id="edit-caseType">
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CaseType.new_}>New</SelectItem>
                    <SelectItem value={CaseType.followup}>Followup</SelectItem>
                    <SelectItem value={CaseType.reassigned}>Reassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-assistanceNeeded">Assistance Needed *</Label>
                <Select value={assistanceNeeded} onValueChange={(v) => setAssistanceNeeded(v as AssistanceNeeded)}>
                  <SelectTrigger id="edit-assistanceNeeded">
                    <SelectValue placeholder="Select assistance type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AssistanceNeeded.no}>No</SelectItem>
                    <SelectItem value={AssistanceNeeded.equinox}>Equinox</SelectItem>
                    <SelectItem value={AssistanceNeeded.onshore}>Onshore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ticketStatus">Ticket Case Status *</Label>
                <Select value={ticketStatus} onValueChange={(v) => setTicketStatus(v as TicketStatus)}>
                  <SelectTrigger id="edit-ticketStatus">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-escalationTransferType">Ticket ESCALATED or TRANSFERRED *</Label>
                <Select
                  value={escalationTransferType}
                  onValueChange={(v) => setEscalationTransferType(v as EscalationTransferType)}
                >
                  <SelectTrigger id="edit-escalationTransferType">
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
                  <Label htmlFor="edit-escalationTransferDestination">Destination Department *</Label>
                  <Select
                    value={escalationTransferDestination}
                    onValueChange={(v) => setEscalationTransferDestination(v as Department)}
                  >
                    <SelectTrigger id="edit-escalationTransferDestination">
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
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={editCase.isPending}>
            {editCase.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
