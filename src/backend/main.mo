import Array "mo:core/Array";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";

import AccessControl "authorization/access-control";

import MixinAuthorization "authorization/MixinAuthorization";

actor {
  public type TaskType = {
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

  public type CaseOrigin = { #chat; #email; #voiceCall };
  public type CaseType = { #new; #followup; #reassigned };
  public type AssistanceNeeded = { #no; #equinox; #onshore };
  public type TicketStatus = {
    #onHold;
    #pending;
    #resolved;
    #open;
    #new;
    #escalated;
    #transferred;
  };

  public type EscalationTransferType = {
    #na;
    #transferred;
    #escalated;
  };

  public type Department = {
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

  public type Case = {
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

  module Case {
    public func compare(case1 : Case, case2 : Case) : Order.Order {
      if (case1.startTime < case2.startTime) { #less }
      else if (case1.startTime > case2.startTime) { #greater }
      else { #equal };
    };
  };

  public type UserProfile = {
    username : Text;
    shiftPreferences : Text;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Shared case store
  let caseStore = Map.empty<Nat, Case>();
  let profileStore = Map.empty<Principal, UserProfile>();
  var nextCaseId = 1;

  // Store utilization stats
  let utilizationStats = Map.empty<Text, { totalWorkSeconds : Nat }>();

  public shared ({ caller }) func saveCallerUserProfile(username : Text, shiftPrefs : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let profile : UserProfile = {
      username;
      shiftPreferences = shiftPrefs;
    };
    profileStore.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profileStore.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profileStore.get(user);
  };

  public shared ({ caller }) func createCase(
    agentName : Text,
    taskType : TaskType,
    caseOrigin : ?CaseOrigin,
    emrCaseNumber : ?Text,
    caseType : ?CaseType,
    assistanceNeeded : ?AssistanceNeeded,
    ticketStatus : ?TicketStatus,
    escalationTransferType : ?EscalationTransferType,
    escalationTransferDestination : ?Department,
    start : Time.Time,
    end : Time.Time,
    notes : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create cases");
    };

    // Verify that the agentName matches the caller's profile username
    let callerProfile = switch (profileStore.get(caller)) {
      case (null) { Runtime.trap("User profile not found. Please create a profile first.") };
      case (?profile) { profile };
    };

    if (callerProfile.username != agentName and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only create cases for your own username");
    };

    if (taskType == #supportEMRTickets) {
      let hasConflict = caseStore.values().any(func(c) { (c.startTime < end) and (c.endTime > start) });
      if (hasConflict) {
        Runtime.trap("Time conflict detected with existing case.");
      };
    };

    let caseRecord : Case = {
      id = nextCaseId;
      agentName;
      taskType;
      caseOrigin;
      emrCaseNumber;
      caseType;
      assistanceNeeded;
      ticketStatus;
      escalationTransferType;
      escalationTransferDestination;
      startTime = start;
      endTime = end;
      notes;
    };
    caseStore.add(nextCaseId, caseRecord);
    nextCaseId += 1;
  };

  public shared ({ caller }) func batchCreateCases(cases : [{
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
  }]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create cases");
    };

    for (caseData in cases.values()) {
      await createCase(
        caseData.agentName,
        caseData.taskType,
        caseData.caseOrigin,
        caseData.emrCaseNumber,
        caseData.caseType,
        caseData.assistanceNeeded,
        caseData.ticketStatus,
        caseData.escalationTransferType,
        caseData.escalationTransferDestination,
        caseData.startTime,
        caseData.endTime,
        caseData.notes,
      );
    };
  };

  public shared ({ caller }) func editCase(
    caseId : Nat,
    agentName : Text,
    taskType : TaskType,
    caseOrigin : ?CaseOrigin,
    emrCaseNumber : ?Text,
    caseType : ?CaseType,
    assistanceNeeded : ?AssistanceNeeded,
    ticketStatus : ?TicketStatus,
    escalationTransferType : ?EscalationTransferType,
    escalationTransferDestination : ?Department,
    start : Time.Time,
    end : Time.Time,
    notes : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can edit cases");
    };

    let existingCase = switch (caseStore.get(caseId)) {
      case (null) { Runtime.trap("Case not found") };
      case (?c) { c };
    };

    // Verify ownership: user can only edit their own cases unless they are admin
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      let callerProfile = switch (profileStore.get(caller)) {
        case (null) { Runtime.trap("User profile not found") };
        case (?profile) { profile };
      };

      if (existingCase.agentName != callerProfile.username) {
        Runtime.trap("Unauthorized: Can only edit your own cases");
      };

      // Also verify that the new agentName matches the caller's username
      if (agentName != callerProfile.username) {
        Runtime.trap("Unauthorized: Cannot change case to a different agent");
      };
    };

    let updatedCase : Case = {
      id = existingCase.id;
      agentName;
      taskType;
      caseOrigin;
      emrCaseNumber;
      caseType;
      assistanceNeeded;
      ticketStatus;
      escalationTransferType;
      escalationTransferDestination;
      startTime = start;
      endTime = end;
      notes;
    };
    caseStore.add(caseId, updatedCase);
  };

  public query ({ caller }) func getAllCases() : async [Case] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cases");
    };
    caseStore.values().toArray().sort();
  };

  public shared ({ caller }) func updateUtilizationStats(agentName : Text, workSeconds : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update utilization stats");
    };

    // Verify that the agentName matches the caller's profile username
    let callerProfile = switch (profileStore.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile };
    };

    if (callerProfile.username != agentName and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only update stats for your own username");
    };

    let current = switch (utilizationStats.get(agentName)) {
      case (null) { { totalWorkSeconds = 0 } };
      case (?stats) { stats };
    };

    let updatedStats = {
      totalWorkSeconds = current.totalWorkSeconds + workSeconds;
    };
    utilizationStats.add(agentName, updatedStats);
  };

  public query ({ caller }) func getUtilizationStats(_period : Time.Time) : async {
    daily : ?Nat;
    weekly : ?Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view statistics");
    };
    { daily = null; weekly = null };
  };
};
