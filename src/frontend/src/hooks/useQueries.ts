import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
  Case,
  TaskType,
  CaseOrigin,
  CaseType,
  AssistanceNeeded,
  TicketStatus,
  EscalationTransferType,
  Department,
  UserProfile,
} from '@/backend';

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
    mutationFn: async (data: {
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
        data.agentName,
        data.taskType,
        data.caseOrigin === null ? null : data.caseOrigin,
        data.emrCaseNumber === null ? null : data.emrCaseNumber,
        data.caseType === null ? null : data.caseType,
        data.assistanceNeeded === null ? null : data.assistanceNeeded,
        data.ticketStatus === null ? null : data.ticketStatus,
        data.escalationTransferType === null ? null : data.escalationTransferType,
        data.escalationTransferDestination === null ? null : data.escalationTransferDestination,
        data.start,
        data.end,
        data.notes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

export function useEditCase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
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
      return actor.editCase(
        data.caseId,
        data.agentName,
        data.taskType,
        data.caseOrigin === null ? null : data.caseOrigin,
        data.emrCaseNumber === null ? null : data.emrCaseNumber,
        data.caseType === null ? null : data.caseType,
        data.assistanceNeeded === null ? null : data.assistanceNeeded,
        data.ticketStatus === null ? null : data.ticketStatus,
        data.escalationTransferType === null ? null : data.escalationTransferType,
        data.escalationTransferDestination === null ? null : data.escalationTransferDestination,
        data.start,
        data.end,
        data.notes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

export function useBatchCreateCases() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      cases: Array<{
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
      }>
    ) => {
      if (!actor) throw new Error('Actor not available');
      // Convert null to undefined for backend compatibility
      const convertedCases = cases.map((c) => ({
        agentName: c.agentName,
        taskType: c.taskType,
        caseOrigin: c.caseOrigin ?? undefined,
        emrCaseNumber: c.emrCaseNumber ?? undefined,
        caseType: c.caseType ?? undefined,
        assistanceNeeded: c.assistanceNeeded ?? undefined,
        ticketStatus: c.ticketStatus ?? undefined,
        escalationTransferType: c.escalationTransferType ?? undefined,
        escalationTransferDestination: c.escalationTransferDestination ?? undefined,
        startTime: c.startTime,
        endTime: c.endTime,
        notes: c.notes,
      }));
      return actor.batchCreateCases(convertedCases);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
}

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
    mutationFn: async (data: { username: string; shiftPrefs: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(data.username, data.shiftPrefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetUtilizationStats() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['utilizationStats'],
    queryFn: async () => {
      if (!actor) return { daily: null, weekly: null };
      return actor.getUtilizationStats(BigInt(0));
    },
    enabled: !!actor && !isFetching,
  });
}
