import { useState } from 'react';
import PersonalStats from '@/components/PersonalStats';
import CaseTimerControls from '@/components/CaseTimerControls';
import CaseList from '@/components/CaseList';
import BreakOverlay from '@/components/BreakOverlay';
import EditCaseModal from '@/components/EditCaseModal';
import { Case } from '@/backend';

export default function Dashboard() {
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditCase = (caseData: Case) => {
    setEditingCase(caseData);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">Track your productivity and manage cases</p>
      </div>

      <PersonalStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CaseTimerControls onBreakStart={() => setIsOnBreak(true)} />
        <CaseList onEditCase={handleEditCase} />
      </div>

      <BreakOverlay isActive={isOnBreak} onEnd={() => setIsOnBreak(false)} />

      <EditCaseModal case={editingCase} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
    </div>
  );
}
