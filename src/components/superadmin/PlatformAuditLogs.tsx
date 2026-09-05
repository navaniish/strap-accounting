import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, Search, Shield, Filter } from 'lucide-react';

export const PlatformAuditLogs: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filtered = auditLogs.filter(a =>
    a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-2 text-trust-600 font-bold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Platform Compliance</span>
          </div>
          <h1 className="text-2xl font-bold text-trust-900 mt-1">Cross-Tenant Audit Logs</h1>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-trust-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-trust-50 border border-trust-300 rounded-xl text-xs font-semibold w-64"
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology space-y-3">
        {filtered.map(log => (
          <div key={log.id} className="p-3.5 bg-trust-50 border border-trust-200 rounded-xl text-xs flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-trust-900">{log.userName}</span>
                <span className="badge-trust text-[10px] px-2 py-0.5 rounded">{log.userRole}</span>
                <span className="font-bold text-sapphire-700">{log.action}</span>
              </div>
              <p className="text-trust-600 italic text-[11px]">{log.details}</p>
            </div>
            <div className="text-right">
              <div className="font-mono text-trust-400 text-[11px]">{log.timestamp}</div>
              <div className="font-mono text-[10px] text-trust-500 font-semibold">{log.businessId}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
