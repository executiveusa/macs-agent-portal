import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { BillingPanel } from '@/components/dashboard/BillingPanel';
import { PipelineBoard } from '@/components/dashboard/PipelineBoard';

const Dashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="rounded-lg border border-maxx-cyan/20 bg-black/30 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-maxx-cyan">Today's move</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Review what MAXX prepared, then approve the next action.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
                This dashboard is Stacy's control room for leads, content, follow-up, and agent skills. Nothing leaves the system without a clear approval point.
              </p>
            </div>
            <button className="inline-flex items-center justify-center rounded-lg bg-maxx-orange px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-black transition-colors hover:bg-white">
              Review Next Action
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
           <StatCard label="Open Missions" value="006" />
           <StatCard label="Leads To Review" value="14" />
           <StatCard label="Content Drafts" value="08" />
           <StatCard label="Needs Stacy" value="03" />
        </div>

        <div>
          <h2 className="mb-4 text-lg font-bold uppercase text-gray-300">Mission Queue</h2>
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
  <div className="rounded-lg border border-gray-800 bg-maxx-secondary p-4">
    <div className="mb-1 text-xs uppercase text-gray-500">{label}</div>
    <div className="text-2xl font-bold text-white">{value}</div>
  </div>
);

export default Dashboard;
