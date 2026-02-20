import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Case {
    id: bigint;
    assistanceNeeded?: AssistanceNeeded;
    startTime: Time;
    escalationTransferDestination?: Department;
    emrCaseNumber?: string;
    endTime: Time;
    caseType?: CaseType;
    agentName: string;
    taskType: TaskType;
    notes: string;
    ticketStatus?: TicketStatus;
    escalationTransferType?: EscalationTransferType;
    caseOrigin?: CaseOrigin;
}
export type Time = bigint;
export interface UserProfile {
    username: string;
    shiftPreferences: string;
}
export enum AssistanceNeeded {
    no = "no",
    equinox = "equinox",
    onshore = "onshore"
}
export enum CaseOrigin {
    chat = "chat",
    email = "email",
    voiceCall = "voiceCall"
}
export enum CaseType {
    new_ = "new",
    followup = "followup",
    reassigned = "reassigned"
}
export enum Department {
    cas = "cas",
    crm = "crm",
    csm = "csm",
    erx = "erx",
    lab = "lab",
    mat = "mat",
    psa = "psa",
    accounting = "accounting",
    emrSupport = "emrSupport",
    productEnhancement = "productEnhancement",
    pdmp = "pdmp",
    billing = "billing",
    sales = "sales",
    clientAdvocates = "clientAdvocates",
    cleanup = "cleanup"
}
export enum EscalationTransferType {
    na = "na",
    escalated = "escalated",
    transferred = "transferred"
}
export enum TaskType {
    pod = "pod",
    clientMeeting = "clientMeeting",
    trainingFeedbackNewTeamMember = "trainingFeedbackNewTeamMember",
    clientSideTraining = "clientSideTraining",
    supportEMRTickets = "supportEMRTickets",
    feedbackReview = "feedbackReview",
    internalTraining = "internalTraining",
    internalTeamMeeting = "internalTeamMeeting",
    trainingNewTeamMember = "trainingNewTeamMember",
    break15 = "break15",
    break30 = "break30"
}
export enum TicketStatus {
    new_ = "new",
    resolved = "resolved",
    pending = "pending",
    escalated = "escalated",
    open = "open",
    transferred = "transferred",
    onHold = "onHold"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    batchCreateCases(cases: Array<{
        assistanceNeeded?: AssistanceNeeded;
        startTime: Time;
        escalationTransferDestination?: Department;
        emrCaseNumber?: string;
        endTime: Time;
        caseType?: CaseType;
        agentName: string;
        taskType: TaskType;
        notes: string;
        ticketStatus?: TicketStatus;
        escalationTransferType?: EscalationTransferType;
        caseOrigin?: CaseOrigin;
    }>): Promise<void>;
    createCase(agentName: string, taskType: TaskType, caseOrigin: CaseOrigin | null, emrCaseNumber: string | null, caseType: CaseType | null, assistanceNeeded: AssistanceNeeded | null, ticketStatus: TicketStatus | null, escalationTransferType: EscalationTransferType | null, escalationTransferDestination: Department | null, start: Time, end: Time, notes: string): Promise<void>;
    editCase(caseId: bigint, agentName: string, taskType: TaskType, caseOrigin: CaseOrigin | null, emrCaseNumber: string | null, caseType: CaseType | null, assistanceNeeded: AssistanceNeeded | null, ticketStatus: TicketStatus | null, escalationTransferType: EscalationTransferType | null, escalationTransferDestination: Department | null, start: Time, end: Time, notes: string): Promise<void>;
    getAllCases(): Promise<Array<Case>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUtilizationStats(_period: Time): Promise<{
        daily?: bigint;
        weekly?: bigint;
    }>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(username: string, shiftPrefs: string): Promise<void>;
    updateUtilizationStats(agentName: string, workSeconds: bigint): Promise<void>;
}
