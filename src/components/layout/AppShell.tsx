import React from 'react';
import { MenuBar } from './MenuBar';
import { Toolbar } from './Toolbar';
import { StatusBar } from './StatusBar';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { ViewportContainer } from '../viewport/ViewportContainer';
import { ExtrudeDialog } from '../dialogs/ExtrudeDialog';
import { DrawingDialog } from '../dialogs/DrawingDialog';
import { JointDialog } from '../dialogs/JointDialog';

export const AppShell: React.FC = () => {
  return (
    <div className="flex flex-col w-screen h-screen bg-[#1a1a1a] text-[#e0e0e0] overflow-hidden">
      {/* 1. MenuBar */}
      <MenuBar />

      {/* 2. Toolbar */}
      <Toolbar />

      {/* 3. Three-column Main Body */}
      <div className="flex flex-1 overflow-hidden relative">
        <LeftPanel />
        <ViewportContainer />
        <RightPanel />
      </div>

      {/* 4. StatusBar */}
      <StatusBar />

      {/* Global CAD Modals */}
      <ExtrudeDialog />
      <DrawingDialog />
      <JointDialog />
    </div>
  );
};
