import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BillingPanel } from '@/components/dashboard/BillingPanel';
import { PipelineBoard } from '@/components/dashboard/PipelineBoard';

const Dashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <StatCard label="Active Agents" value="006" />
           <StatCard label="Pipeline Uptime" value="99.9%" />
           <StatCard label="Tokens Used" value="1.2M" />
           <StatCard label="Next Bill" value="$0.00" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-300 mb-4 uppercase">Mission Pipelines</h2>
          <PipelineBoard />
        </div>

        <div>
           <BillingPanel />
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ label, value }: { label: string, value: string }) => (
  <div className="bg-maxx-secondary border border-gray-800 p-4 rounded-lg">
    <div className="text-xs text-gray-500 uppercase font-mono mb-1">{label}</div>
    <div className="text-2xl font-bold text-white">{value}</div>
  </div>
);

export default Dashboard;
