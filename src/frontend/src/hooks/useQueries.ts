import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Case, UserProfile, TaskType, CaseOrigin, CaseType, AssistanceNeeded, TicketStatus, EscalationTransferType, Department } from '../backend';
import { toast } from 'sonner';

// Helper to convert null to undefined for backend compatibility
const toUndefined = <T,>(value: T | null): T | undefined => {
  return value === null ? undefined : value;
};

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, shiftPrefs }: { username: string; shiftPrefs: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(username, shiftPrefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetAllCases() {
  const { actor, isFetching } = useActor();

  return useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCases();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      agentName: string;
      taskType: TaskType;
      caseOrigin: CaseOrigin | null;
      emrCaseNumber: string | null;
      caseType: CaseType | null;
      assistanceNeeded: AssistanceNeeded | null;
      ticketStatus: TicketStatus | null;
      escalationTransferType: EscalationTransferType | null;
      escalationTransferDestination: Department | null;
      start: bigint;
      end: bigint;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      
      return actor.createCase(
        params.agentName,
        params.taskType,
        params.caseOrigin,
        params.emrCaseNumber,
        params.caseType,
        params.assistanceNeeded,
        params.ticketStatus,
        params.escalationTransferType,
        params.escalationTransferDestination,
        params.start,
        params.end,
        params.notes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (error: any) => {
      console.error('Create case error:', error);
      toast.error(error.message || 'Failed to create case');
    },
  });
}

export function useEditCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      caseId: bigint;
      agentName: string;
      taskType: TaskType;
      caseOrigin: CaseOrigin | null;
      emrCaseNumber: string | null;
      caseType: CaseType | null;
      assistanceNeeded: AssistanceNeeded | null;
      ticketStatus: TicketStatus | null;
      escalationTransferType: EscalationTransferType | null;
      escalationTransferDestination: Department | null;
      start: bigint;
      end: bigint;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      
      console.log('Editing case with params:', {
        caseId: params.caseId.toString(),
        agentName: params.agentName,
        taskType: params.taskType,
        start: params.start.toString(),
        end: params.end.toString(),
      });

      return actor.editCase(
        params.caseId,
        params.agentName,
        params.taskType,
        params.caseOrigin,
        params.emrCaseNumber,
        params.caseType,
        params.assistanceNeeded,
        params.ticketStatus,
        params.escalationTransferType,
        params.escalationTransferDestination,
        params.start,
        params.end,
        params.notes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success('Case updated successfully');
    },
    onError: (error: any) => {
      console.error('Edit case error:', error);
      toast.error(error.message || 'Failed to update case');
    },
  });
}

export function useBatchCreateCases() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cases: Array<{
      agentName: string;
      taskType: TaskType;
      caseOrigin: CaseOrigin | null;
      emrCaseNumber: string | null;
      caseType: CaseType | null;
      assistanceNeeded: AssistanceNeeded | null;
      ticketStatus: TicketStatus | null;
      escalationTransferType: EscalationTransferType | null;
      escalationTransferDestination: Department | null;
      startTime: bigint;
      endTime: bigint;
      notes: string;
    }>) => {
      if (!actor) throw new Error('Actor not available');
      
      // Convert null to undefined for backend compatibility
      const casesWithUndefined = cases.map(c => ({
        agentName: c.agentName,
        taskType: c.taskType,
        caseOrigin: toUndefined(c.caseOrigin),
        emrCaseNumber: toUndefined(c.emrCaseNumber),
        caseType: toUndefined(c.caseType),
        assistanceNeeded: toUndefined(c.assistanceNeeded),
        ticketStatus: toUndefined(c.ticketStatus),
        escalationTransferType: toUndefined(c.escalationTransferType),
        escalationTransferDestination: toUndefined(c.escalationTransferDestination),
        startTime: c.startTime,
        endTime: c.endTime,
        notes: c.notes,
      }));

      return actor.batchCreateCases(casesWithUndefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}
