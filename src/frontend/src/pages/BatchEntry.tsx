import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useBatchCreateCases } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { Plus, Trash2, FileSpreadsheet } from 'lucide-react';
import {
  TaskType,
  CaseOrigin,
  CaseType,
  AssistanceNeeded,
  TicketStatus,
  EscalationTransferType,
  Department,
} from '@/backend';
import { dateTimeLocalToNano, validateTimeRange } from '@/utils/timeHelpers';

interface BatchEntry {
  id: string;
  agentName: string;
  taskType: TaskType;
  caseOrigin: CaseOrigin | '';
  emrCaseNumber: string;
  caseType: CaseType | '';
  assistanceNeeded: AssistanceNeeded | '';
  ticketStatus: TicketStatus | '';
  escalationTransferType: EscalationTransferType | '';
  escalationTransferDestination: Department | '';
  startTime: string;
  endTime: string;
  notes: string;
}

export default function BatchEntry() {
  const [entries, setEntries] = useState<BatchEntry[]>([
    {
      id: '1',
      agentName: '',
      taskType: TaskType.supportEMRTickets,
      caseOrigin: '',
      emrCaseNumber: '',
      caseType: '',
      assistanceNeeded: '',
      ticketStatus: '',
      escalationTransferType: '',
      escalationTransferDestination: '',
      startTime: '',
      endTime: '',
      notes: '',
    },
  ]);

  const batchCreate = useBatchCreateCases();

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        id: Date.now().toString(),
        agentName: '',
        taskType: TaskType.supportEMRTickets,
        caseOrigin: '',
        emrCaseNumber: '',
        caseType: '',
        assistanceNeeded: '',
        ticketStatus: '',
        escalationTransferType: '',
        escalationTransferDestination: '',
        startTime: '',
        endTime: '',
        notes: '',
      },
    ]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter((e) => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof BatchEntry, value: any) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const handleSubmit = async () => {
    // Validate entries
    for (const entry of entries) {
      if (!entry.agentName.trim()) {
        toast.error('Agent name is required for all entries');
        return;
      }
      if (!entry.startTime || !entry.endTime) {
        toast.error('Start and end times are required for all entries');
        return;
      }
      if (!validateTimeRange(entry.startTime, entry.endTime)) {
        toast.error('End time must be after start time for all entries');
        return;
      }
      if (entry.taskType === TaskType.supportEMRTickets) {
        if (!entry.caseType) {
          toast.error('Case Type is required for EMR tickets');
          return;
        }
        if (!entry.assistanceNeeded) {
          toast.error('Assistance Needed is required for EMR tickets');
          return;
        }
        if (!entry.ticketStatus) {
          toast.error('Ticket Status is required for EMR tickets');
          return;
        }
        if (!entry.escalationTransferType) {
          toast.error('Escalation/Transfer classification is required for EMR tickets');
          return;
        }
        const showDest =
          entry.escalationTransferType === EscalationTransferType.escalated ||
          entry.escalationTransferType === EscalationTransferType.transferred;
        if (showDest && !entry.escalationTransferDestination) {
          toast.error('Escalation/Transfer destination is required');
          return;
        }
      }
    }

    const cases = entries
      .filter((e) => e.startTime && e.endTime)
      .map((e) => {
        const isEMR = e.taskType === TaskType.supportEMRTickets;
        const showDest =
          e.escalationTransferType === EscalationTransferType.escalated ||
          e.escalationTransferType === EscalationTransferType.transferred;

        return {
          agentName: e.agentName.trim(),
          taskType: e.taskType,
          caseOrigin: isEMR && e.caseOrigin ? e.caseOrigin : null,
          emrCaseNumber: isEMR && e.emrCaseNumber ? e.emrCaseNumber : null,
          caseType: isEMR && e.caseType ? e.caseType : null,
          assistanceNeeded: isEMR && e.assistanceNeeded ? e.assistanceNeeded : null,
          ticketStatus: isEMR && e.ticketStatus ? e.ticketStatus : null,
          escalationTransferType: isEMR && e.escalationTransferType ? e.escalationTransferType : null,
          escalationTransferDestination: isEMR && showDest && e.escalationTransferDestination ? e.escalationTransferDestination : null,
          startTime: dateTimeLocalToNano(e.startTime),
          endTime: dateTimeLocalToNano(e.endTime),
          notes: e.notes || '',
        };
      });

    if (cases.length === 0) {
      toast.error('Please fill in at least one complete entry');
      return;
    }

    try {
      await batchCreate.mutateAsync(cases);
      toast.success(`${cases.length} case(s) logged successfully!`);
      setEntries([
        {
          id: '1',
          agentName: '',
          taskType: TaskType.supportEMRTickets,
          caseOrigin: '',
          emrCaseNumber: '',
          caseType: '',
          assistanceNeeded: '',
          ticketStatus: '',
          escalationTransferType: '',
          escalationTransferDestination: '',
          startTime: '',
          endTime: '',
          notes: '',
        },
      ]);
    } catch (error: any) {
      if (error.message?.includes('conflict')) {
        toast.error('Time conflict detected! Check for overlapping times.');
      } else {
        toast.error('Failed to log cases');
      }
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
          Batch Entry
        </h1>
        <p className="text-muted-foreground text-lg">Log multiple cases at once</p>
      </div>

      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-chart-2/5 to-chart-2/10">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-chart-2" />
            Batch Case Logger
          </CardTitle>
          <CardDescription>Add multiple cases. The system will check for time conflicts before saving.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          {entries.map((entry, index) => {
            const isEMR = entry.taskType === TaskType.supportEMRTickets;
            const showDest =
              entry.escalationTransferType === EscalationTransferType.escalated ||
              entry.escalationTransferType === EscalationTransferType.transferred;

            return (
              <div key={entry.id} className="p-5 border-2 border-border rounded-xl space-y-4 bg-card hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-primary">Entry {index + 1}</span>
                  {entries.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntry(entry.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Agent Name</Label>
                  <Input
                    placeholder="Enter agent name"
                    value={entry.agentName}
                    onChange={(e) => updateEntry(entry.id, 'agentName', e.target.value)}
                    className="border-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Task Type</Label>
                  <Select value={entry.taskType} onValueChange={(v) => updateEntry(entry.id, 'taskType', v as TaskType)}>
                    <SelectTrigger className="border-2">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-accent/30 rounded-lg border-2 border-dashed">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={entry.startTime}
                      onChange={(e) => updateEntry(entry.id, 'startTime', e.target.value)}
                      className="border-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="datetime-local"
                      value={entry.endTime}
                      onChange={(e) => updateEntry(entry.id, 'endTime', e.target.value)}
                      className="border-2"
                    />
                  </div>
                </div>

                {isEMR && (
                  <div className="border-t-2 pt-4 space-y-4">
                    <h4 className="font-semibold text-sm text-primary">Case Classification – EMR</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Case Origin</Label>
                        <Select
                          value={entry.caseOrigin}
                          onValueChange={(v) => updateEntry(entry.id, 'caseOrigin', v as CaseOrigin)}
                        >
                          <SelectTrigger>
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
                        <Label>EMR Case#</Label>
                        <Input
                          placeholder="Enter case number"
                          value={entry.emrCaseNumber}
                          onChange={(e) => updateEntry(entry.id, 'emrCaseNumber', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Case Type <span className="text-destructive">*</span>
                      </Label>
                      <Select value={entry.caseType} onValueChange={(v) => updateEntry(entry.id, 'caseType', v as CaseType)}>
                        <SelectTrigger>
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
                      <Label>
                        Assistance Needed <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={entry.assistanceNeeded}
                        onValueChange={(v) => updateEntry(entry.id, 'assistanceNeeded', v as AssistanceNeeded)}
                      >
                        <SelectTrigger>
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
                      <Label>
                        Ticket Case Status <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={entry.ticketStatus}
                        onValueChange={(v) => updateEntry(entry.id, 'ticketStatus', v as TicketStatus)}
                      >
                        <SelectTrigger>
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
                      <Label>
                        Ticket ESCALATED or TRANSFERRED <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={entry.escalationTransferType}
                        onValueChange={(v) => updateEntry(entry.id, 'escalationTransferType', v as EscalationTransferType)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select classification" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EscalationTransferType.na}>N/A</SelectItem>
                          <SelectItem value={EscalationTransferType.transferred}>Transferred</SelectItem>
                          <SelectItem value={EscalationTransferType.escalated}>Escalated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {showDest && (
                      <div className="space-y-2">
                        <Label>
                          Destination Department <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={entry.escalationTransferDestination}
                          onValueChange={(v) => updateEntry(entry.id, 'escalationTransferDestination', v as Department)}
                        >
                          <SelectTrigger>
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
                  <Label>Notes</Label>
                  <Input
                    placeholder="Add any additional notes..."
                    value={entry.notes}
                    onChange={(e) => updateEntry(entry.id, 'notes', e.target.value)}
                  />
                </div>
              </div>
            );
          })}

          <div className="flex gap-3 pt-4">
            <Button onClick={addEntry} variant="outline" className="flex-1 h-12 border-2 shadow-md">
              <Plus className="mr-2 h-5 w-5" />
              Add Another Entry
            </Button>
            <Button onClick={handleSubmit} disabled={batchCreate.isPending} className="flex-1 h-12 shadow-md font-semibold">
              {batchCreate.isPending ? 'Logging...' : `Log ${entries.length} Case${entries.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
