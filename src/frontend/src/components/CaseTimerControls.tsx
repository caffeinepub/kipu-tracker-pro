import React, { useState, useEffect } from 'react';
import { Play, Square, Save, Coffee } from 'lucide-react';
import { useCreateCase, useGetCallerUserProfile } from '../hooks/useQueries';
import { TaskType, CaseOrigin, CaseType, AssistanceNeeded, TicketStatus, EscalationTransferType, Department } from '../backend';
import { convertToNanoseconds, getCurrentISTDatetimeLocal, validateTimeRange } from '../utils/timeHelpers';
import { useElapsedTime } from '../hooks/useElapsedTime';
import { toast } from 'sonner';
import type { TimeEntryMode } from './Layout';

interface CaseTimerControlsProps {
  mode?: TimeEntryMode;
  onBreakStart?: () => void;
}

export default function CaseTimerControls({ mode = 'auto', onBreakStart }: CaseTimerControlsProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const createCase = useCreateCase();

  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [taskType, setTaskType] = useState<TaskType>(TaskType.supportEMRTickets);
  const [notes, setNotes] = useState('');

  // Manual mode fields
  const [manualStartDate, setManualStartDate] = useState('');
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndDate, setManualEndDate] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');

  // EMR-specific fields
  const [caseOrigin, setCaseOrigin] = useState<CaseOrigin | ''>('');
  const [emrCaseNumber, setEmrCaseNumber] = useState('');
  const [caseType, setCaseType] = useState<CaseType | ''>('');
  const [assistanceNeeded, setAssistanceNeeded] = useState<AssistanceNeeded | ''>('');
  const [ticketStatus, setTicketStatus] = useState<TicketStatus | ''>('');
  const [escalationTransferType, setEscalationTransferType] = useState<EscalationTransferType | ''>('');
  const [escalationTransferDestination, setEscalationTransferDestination] = useState<Department | ''>('');

  const elapsedTime = useElapsedTime(isRunning ? startTime : null);

  const isEMRTask = taskType === TaskType.supportEMRTickets;

  useEffect(() => {
    if (mode === 'manual') {
      const now = getCurrentISTDatetimeLocal();
      setManualStartDate(now.split('T')[0]);
      setManualStartTime(now.split('T')[1]);
      setManualEndDate(now.split('T')[0]);
      setManualEndTime(now.split('T')[1]);
    }
  }, [mode]);

  const handleStart = () => {
    if (mode === 'auto') {
      setStartTime(Date.now());
      setIsRunning(true);
      toast.success('Timer started');
    } else {
      toast.info('In manual mode - set times and click Save Record');
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    toast.info('Timer stopped - click Save Record to save');
  };

  const handleBreak = () => {
    if (onBreakStart) {
      onBreakStart();
    }
  };

  const handleSave = async () => {
    if (!userProfile) {
      toast.error('User profile not found');
      return;
    }

    try {
      let startNs: bigint;
      let endNs: bigint;

      if (mode === 'auto') {
        if (!startTime) {
          toast.error('Please start the timer first');
          return;
        }
        const endTime = Date.now();
        startNs = convertToNanoseconds(startTime);
        endNs = convertToNanoseconds(endTime);
      } else {
        // Manual mode
        if (!manualStartDate || !manualStartTime || !manualEndDate || !manualEndTime) {
          toast.error('Please fill in all date and time fields');
          return;
        }

        const startDatetime = `${manualStartDate}T${manualStartTime}`;
        const endDatetime = `${manualEndDate}T${manualEndTime}`;

        const validation = validateTimeRange(startDatetime, endDatetime);
        if (!validation.valid) {
          toast.error(validation.error || 'Invalid time range');
          return;
        }

        startNs = convertToNanoseconds(new Date(startDatetime).getTime());
        endNs = convertToNanoseconds(new Date(endDatetime).getTime());
      }

      // Validate EMR fields if needed
      if (isEMRTask) {
        if (!caseOrigin || !emrCaseNumber || !caseType || !assistanceNeeded || !ticketStatus) {
          toast.error('Please fill in all required EMR fields');
          return;
        }
      }

      await createCase.mutateAsync({
        agentName: userProfile.username,
        taskType,
        caseOrigin: caseOrigin || null,
        emrCaseNumber: emrCaseNumber || null,
        caseType: caseType || null,
        assistanceNeeded: assistanceNeeded || null,
        ticketStatus: ticketStatus || null,
        escalationTransferType: escalationTransferType || null,
        escalationTransferDestination: escalationTransferDestination || null,
        start: startNs,
        end: endNs,
        notes,
      });

      // Reset form
      setIsRunning(false);
      setStartTime(null);
      setNotes('');
      setCaseOrigin('');
      setEmrCaseNumber('');
      setCaseType('');
      setAssistanceNeeded('');
      setTicketStatus('');
      setEscalationTransferType('');
      setEscalationTransferDestination('');
      
      if (mode === 'manual') {
        const now = getCurrentISTDatetimeLocal();
        setManualStartDate(now.split('T')[0]);
        setManualStartTime(now.split('T')[1]);
        setManualEndDate(now.split('T')[0]);
        setManualEndTime(now.split('T')[1]);
      }

      toast.success('Case saved successfully');
    } catch (error: any) {
      console.error('Error saving case:', error);
      toast.error(error.message || 'Failed to save case');
    }
  };

  return (
    <div className="bg-[#1e2433]/80 backdrop-blur-sm rounded-xl p-6 border border-gray-800 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-100">Case Tracking</h2>

      {mode === 'auto' && (
        <div className="mb-6 text-center">
          <div className="text-6xl font-mono font-bold text-blue-400">
            {elapsedTime}
          </div>
          <p className="text-gray-400 mt-2">Elapsed Time</p>
        </div>
      )}

      <div className="space-y-4">
        {mode === 'manual' && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-[#252b3d] rounded-lg border border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={manualStartDate}
                onChange={(e) => setManualStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
              <input
                type="time"
                value={manualStartTime}
                onChange={(e) => setManualStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                value={manualEndDate}
                onChange={(e) => setManualEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
              <input
                type="time"
                value={manualEndTime}
                onChange={(e) => setManualEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Task Type</label>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value as TaskType)}
            className="w-full px-3 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={TaskType.supportEMRTickets}>Support EMR Tickets</option>
            <option value={TaskType.break15}>Break (15 min)</option>
            <option value={TaskType.break30}>Break (30 min)</option>
            <option value={TaskType.clientMeeting}>Client Meeting</option>
            <option value={TaskType.clientSideTraining}>Client Side Training</option>
            <option value={TaskType.internalTeamMeeting}>Internal Team Meeting</option>
            <option value={TaskType.pod}>POD</option>
            <option value={TaskType.feedbackReview}>Feedback Review</option>
            <option value={TaskType.internalTraining}>Internal Training</option>
            <option value={TaskType.trainingNewTeamMember}>Training New Team Member</option>
            <option value={TaskType.trainingFeedbackNewTeamMember}>Training Feedback New Team Member</option>
          </select>
        </div>

        {isEMRTask && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Case Origin *</label>
                <select
                  value={caseOrigin}
                  onChange={(e) => setCaseOrigin(e.target.value as CaseOrigin)}
                  className="w-full px-3 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value={CaseOrigin.chat}>Chat</option>
                  <option value={CaseOrigin.email}>Email</option>
                  <option value={CaseOrigin.voiceCall}>Voice Call</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">EMR Case Number *</label>
                <input
                  type="text"
                  value={emrCaseNumber}
                  onChange={(e) => setEmrCaseNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter case number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Case Type *</label>
                <select
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value as CaseType)}
                  className="w-full px-3 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value={CaseType.new_}>New</option>
                  <option value={CaseType.followup}>Follow-up</option>
                  <option value={CaseType.reassigned}>Reassigned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Assistance Needed *</label>
                <select
                  value={assistanceNeeded}
                  onChange={(e) => setAssistanceNeeded(e.target.value as AssistanceNeeded)}
                  className="w-full px-3 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value={AssistanceNeeded.no}>No</option>
                  <option value={AssistanceNeeded.equinox}>Equinox</option>
                  <option value={AssistanceNeeded.onshore}>Onshore</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ticket Status *</label>
                <select
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value as TicketStatus)}
                  className="w-full px-3 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value={TicketStatus.new_}>New</option>
                  <option value={TicketStatus.open}>Open</option>
                  <option value={TicketStatus.pending}>Pending</option>
                  <option value={TicketStatus.onHold}>On Hold</option>
                  <option value={TicketStatus.resolved}>Resolved</option>
                  <option value={TicketStatus.escalated}>Escalated</option>
                  <option value={TicketStatus.transferred}>Transferred</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Escalation/Transfer Type</label>
                <select
                  value={escalationTransferType}
                  onChange={(e) => setEscalationTransferType(e.target.value as EscalationTransferType)}
                  className="w-full px-3 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value={EscalationTransferType.na}>N/A</option>
                  <option value={EscalationTransferType.escalated}>Escalated</option>
                  <option value={EscalationTransferType.transferred}>Transferred</option>
                </select>
              </div>
            </div>

            {(escalationTransferType === EscalationTransferType.escalated || 
              escalationTransferType === EscalationTransferType.transferred) && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Destination Department</label>
                <select
                  value={escalationTransferDestination}
                  onChange={(e) => setEscalationTransferDestination(e.target.value as Department)}
                  className="w-full px-3 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value={Department.csm}>CSM</option>
                  <option value={Department.billing}>Billing</option>
                  <option value={Department.psa}>PSA</option>
                  <option value={Department.clientAdvocates}>Client Advocates</option>
                  <option value={Department.mat}>MAT</option>
                  <option value={Department.erx}>eRx</option>
                  <option value={Department.lab}>Lab</option>
                  <option value={Department.sales}>Sales</option>
                  <option value={Department.accounting}>Accounting</option>
                  <option value={Department.emrSupport}>EMR Support</option>
                  <option value={Department.cleanup}>Cleanup</option>
                  <option value={Department.cas}>CAS</option>
                  <option value={Department.productEnhancement}>Product Enhancement</option>
                  <option value={Department.crm}>CRM</option>
                  <option value={Department.pdmp}>PDMP</option>
                </select>
              </div>
            )}
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Add any additional notes..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          {mode === 'auto' && (
            <>
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="btn-start flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  <Play className="w-5 h-5" />
                  Start
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="btn-stop flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  <Square className="w-5 h-5" />
                  Stop
                </button>
              )}
            </>
          )}

          <button
            onClick={handleBreak}
            className="btn-break flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
          >
            <Coffee className="w-5 h-5" />
            Break
          </button>

          <button
            onClick={handleSave}
            disabled={createCase.isPending}
            className="btn-save flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {createCase.isPending ? 'Saving...' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  );
}
