import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useEditCase } from '../hooks/useQueries';
import { TaskType, CaseOrigin, CaseType, AssistanceNeeded, TicketStatus, EscalationTransferType, Department } from '../backend';
import type { Case } from '../backend';
import { convertToNanoseconds, convertFromNanoseconds, validateTimeRange } from '../utils/timeHelpers';
import { toast } from 'sonner';

interface EditCaseModalProps {
  caseData: Case;
  onClose: () => void;
}

export default function EditCaseModal({ caseData, onClose }: EditCaseModalProps) {
  const editCase = useEditCase();

  const [taskType, setTaskType] = useState<TaskType>(caseData.taskType);
  const [notes, setNotes] = useState(caseData.notes);

  // Convert nanoseconds to datetime-local format
  const startDatetime = convertFromNanoseconds(caseData.startTime);
  const endDatetime = convertFromNanoseconds(caseData.endTime);

  const [startDate, setStartDate] = useState(startDatetime.split('T')[0]);
  const [startTime, setStartTime] = useState(startDatetime.split('T')[1]);
  const [endDate, setEndDate] = useState(endDatetime.split('T')[0]);
  const [endTime, setEndTime] = useState(endDatetime.split('T')[1]);

  // EMR-specific fields
  const [caseOrigin, setCaseOrigin] = useState<CaseOrigin | ''>(caseData.caseOrigin || '');
  const [emrCaseNumber, setEmrCaseNumber] = useState(caseData.emrCaseNumber || '');
  const [caseType, setCaseType] = useState<CaseType | ''>(caseData.caseType || '');
  const [assistanceNeeded, setAssistanceNeeded] = useState<AssistanceNeeded | ''>(caseData.assistanceNeeded || '');
  const [ticketStatus, setTicketStatus] = useState<TicketStatus | ''>(caseData.ticketStatus || '');
  const [escalationTransferType, setEscalationTransferType] = useState<EscalationTransferType | ''>(
    caseData.escalationTransferType || ''
  );
  const [escalationTransferDestination, setEscalationTransferDestination] = useState<Department | ''>(
    caseData.escalationTransferDestination || ''
  );

  const isEMRTask = taskType === TaskType.supportEMRTickets;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate datetime fields
      if (!startDate || !startTime || !endDate || !endTime) {
        toast.error('Please fill in all date and time fields');
        return;
      }

      const startDatetimeStr = `${startDate}T${startTime}`;
      const endDatetimeStr = `${endDate}T${endTime}`;

      const validation = validateTimeRange(startDatetimeStr, endDatetimeStr);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid time range');
        return;
      }

      // Validate EMR fields if needed
      if (isEMRTask) {
        if (!caseOrigin || !emrCaseNumber || !caseType || !assistanceNeeded || !ticketStatus) {
          toast.error('Please fill in all required EMR fields');
          return;
        }
      }

      // Convert to nanoseconds
      const startNs = convertToNanoseconds(new Date(startDatetimeStr).getTime());
      const endNs = convertToNanoseconds(new Date(endDatetimeStr).getTime());

      // Call the mutation with proper null handling
      await editCase.mutateAsync({
        caseId: caseData.id,
        agentName: caseData.agentName,
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

      toast.success('Case updated successfully');
      onClose();
    } catch (error: any) {
      console.error('Error updating case:', error);
      toast.error(error.message || 'Failed to update case');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e2433] rounded-xl border border-gray-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1e2433] border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-100">Edit Case</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-[#252b3d] rounded-lg border border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Task Type</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as TaskType)}
              className="w-full px-3 py-2 bg-[#252b3d] border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
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
                    required
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
                    required
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
                    required
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
                    required
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
                    required
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
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editCase.isPending}
              className="btn-save flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {editCase.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
