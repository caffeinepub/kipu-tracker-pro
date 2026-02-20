import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";

module {
  type TaskType = {
    #supportEMRTickets;
    #break15;
    #break30;
    #clientMeeting;
    #clientSideTraining;
    #internalTeamMeeting;
    #pod;
    #feedbackReview;
    #internalTraining;
    #trainingNewTeamMember;
    #trainingFeedbackNewTeamMember;
  };

  type CaseOrigin = { #chat; #email; #voiceCall };
  type CaseType = { #new; #followup; #reassigned };
  type AssistanceNeeded = { #no; #equinox; #onshore };
  type TicketStatus = {
    #onHold;
    #pending;
    #resolved;
    #open;
    #new;
    #escalated;
    #transferred;
  };

  type EscalationTransferType = {
    #na;
    #transferred;
    #escalated;
  };

  type Department = {
    #csm;
    #billing;
    #psa;
    #clientAdvocates;
    #mat;
    #erx;
    #lab;
    #sales;
    #accounting;
    #emrSupport;
    #cleanup;
    #cas;
    #productEnhancement;
    #crm;
    #pdmp;
  };

  type Case = {
    id : Nat;
    agentName : Text;
    taskType : TaskType;
    caseOrigin : ?CaseOrigin;
    emrCaseNumber : ?Text;
    caseType : ?CaseType;
    assistanceNeeded : ?AssistanceNeeded;
    ticketStatus : ?TicketStatus;
    escalationTransferType : ?EscalationTransferType;
    escalationTransferDestination : ?Department;
    startTime : Time.Time;
    endTime : Time.Time;
    notes : Text;
  };

  type UserProfile = {
    username : Text;
    shiftPreferences : Text;
  };

  type OldActor = {
    caseStore : Map.Map<Nat, Case>;
    profileStore : Map.Map<Principal, UserProfile>;
    nextCaseId : Nat;
  };

  type NewActor = {
    caseStore : Map.Map<Nat, Case>;
    profileStore : Map.Map<Principal, UserProfile>;
    nextCaseId : Nat;
    utilizationStats : Map.Map<Text, { totalWorkSeconds : Nat }>;
  };

  public func run(old : OldActor) : NewActor {
    { old with utilizationStats = Map.empty<Text, { totalWorkSeconds : Nat }>() };
  };
};
