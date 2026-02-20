import React, { useState } from 'react';
import PersonalStats from '../components/PersonalStats';
import CaseTimerControls from '../components/CaseTimerControls';
import CaseList from '../components/CaseList';
import BreakOverlay from '../components/BreakOverlay';
import EditCaseModal from '../components/EditCaseModal';
import type { Case } from '../backend';
import type { TimeEntryMode } from '../components/Layout';

interface DashboardProps {
  mode?: TimeEntryMode;
  setMode?: (mode: TimeEntryMode) => void;
}

export default function Dashboard({ mode = 'auto', setMode }: DashboardProps) {
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);

  const handleBreakStart = () => {
    setIsBreakActive(true);
  };

  const handleBreakEnd = () => {
    setIsBreakActive(false);
  };

  const handleEditCase = (caseData: Case) => {
    setEditingCase(caseData);
  };

  const handleCloseEditModal = () => {
    setEditingCase(null);
  };

  return (
    <>
      <div className="space-y-8">
        <PersonalStats />
        <CaseTimerControls mode={mode} onBreakStart={handleBreakStart} />
        <CaseList onEditCase={handleEditCase} />
      </div>

      <BreakOverlay isActive={isBreakActive} onEnd={handleBreakEnd} />
      
      {editingCase && (
        <EditCaseModal
          caseData={editingCase}
          onClose={handleCloseEditModal}
        />
      )}
    </>
  );
}
