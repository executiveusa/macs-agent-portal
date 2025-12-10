import React from 'react';
import { MoreHorizontal, PlayCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

export const PipelineBoard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      <Column title="Queued" count={2} statusColor="border-gray-600">
        <JobCard title="Agent_Smith_V3" type="Avatar Gen" time="2m ago" />
        <JobCard title="Landing_Page_X" type="Site Deploy" time="10m ago" />
      </Column>
      <Column title="Processing" count={1} statusColor="border-maxx-orange">
        <JobCard title="Crypto_Dash_Main" type="App Builder" time="Running..." active />
      </Column>
      <Column title="Online" count={4} statusColor="border-maxx-cyan">
        <JobCard title="MACS_Portal_v1" type="Production" time="Deployed" status="success" />
        <JobCard title="Test_Net_Node" type="Infrastructure" time="Deployed" status="success" />
      </Column>
    </div>
  );
};

const Column = ({ title, count, children, statusColor }: any) => (
  <div className="bg-maxx-bg/50 border border-gray-800 rounded-lg flex flex-col h-[500px]">
    <div className={`p-4 border-b border-gray-800 flex justify-between items-center border-t-2 ${statusColor}`}>
      <h4 className="font-bold text-sm uppercase text-gray-300">{title}</h4>
      <span className="bg-gray-800 text-xs px-2 py-0.5 rounded text-gray-400">{count}</span>
    </div>
    <div className="p-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
      {children}
    </div>
  </div>
);

const JobCard = ({ title, type, time, active, status }: any) => (
  <div className={`bg-gray-900 border border-gray-800 p-4 rounded hover:border-gray-600 transition-colors cursor-pointer group ${active ? 'ring-1 ring-maxx-orange/50' : ''}`}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-xs font-mono text-gray-500 bg-black/30 px-1 rounded">{type}</span>
      <button className="text-gray-600 hover:text-white"><MoreHorizontal size={14} /></button>
    </div>
    <h5 className="text-sm font-bold text-white mb-1 group-hover:text-maxx-cyan transition-colors">{title}</h5>
    <div className="flex items-center gap-2 text-xs text-gray-500">
      {active && <LoaderIcon />}
      {status === 'success' && <CheckCircle2 size={12} className="text-green-500" />}
      {time}
    </div>
    {/* Progress bar if active */}
    {active && (
      <div className="w-full bg-gray-800 h-1 mt-3 rounded-full overflow-hidden">
        <div className="bg-maxx-orange h-full w-2/3 animate-pulse"></div>
      </div>
    )}
  </div>
);

const LoaderIcon = () => (
  <svg className="animate-spin h-3 w-3 text-maxx-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
