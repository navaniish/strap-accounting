import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Building2, 
  DollarSign, 
  Users, 
  AlertOctagon, 
  CheckCircle, 
  XCircle, 
  Search, 
  Lock, 
  FileText,
  Sparkles
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { allBusinesses, platformMetrics, auditLogs } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredBusinesses = allBusinesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.workspaceId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Super Admin Operator Banner */}
      <div className="bg-gradient-to-r from-tier-900 via-trust-900 to-tier-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-tier-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-tier-300 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-tier-400" />
            <span>SaaS Operator Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Super Admin Platform Control</h1>
          <p className="text-tier-200 text-xs sm:text-sm mt-1">
            Platform-level management for all tenant workspaces, billing subscriptions, MRR metrics, and cross-tenant audit logs.
          </p>
        </div>

        <div className="bg-tier-800/80 border border-tier-700 px-4 py-2.5 rounded-xl text-right">
          <div className="text-[10px] uppercase text-tier-300 font-bold">Platform Status</div>
          <div className="text-sm font-bold text-growth-400 flex items-center gap-1.5 justify-end">
            <span className="w-2 h-2 rounded-full bg-growth-500 animate-ping" /> 100% Operational
          </div>
        </div>
      </div>

      {/* Global Platform Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="p-4 bg-white rounded-2xl border border-trust-200 shadow-psychology space-y-1">
          <div className="text-[10px] font-bold text-trust-400 uppercase">Total Businesses</div>
          <div className="text-2xl font-extrabold text-trust-900">{platformMetrics.totalBusinesses.toLocaleString()}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-growth-200 shadow-psychology space-y-1">
          <div className="text-[10px] font-bold text-growth-700 uppercase">Active Customers</div>
          <div className="text-2xl font-extrabold text-growth-700">{platformMetrics.activeBusinesses.toLocaleString()}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-urgency-200 shadow-psychology space-y-1">
          <div className="text-[10px] font-bold text-urgency-700 uppercase">Suspended</div>
          <div className="text-2xl font-extrabold text-urgency-700">{platformMetrics.suspendedBusinesses}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-trust-200 shadow-psychology space-y-1">
          <div className="text-[10px] font-bold text-trust-400 uppercase">Active Users</div>
          <div className="text-2xl font-extrabold text-trust-900">{platformMetrics.activeUsers.toLocaleString()}</div>
        </div>

      </div>

      {/* Tenant Businesses Table */}
      <div className="bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="font-bold text-trust-900 text-lg flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-tier-600" />
            <span>Customer Business Tenants</span>
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 text-trust-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search business name or workspace ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-trust-50 border border-trust-300 rounded-xl text-xs font-semibold w-full sm:w-64 focus:ring-2 focus:ring-tier-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-trust-100 text-trust-700 uppercase font-bold border-b border-trust-200">
                <th className="p-3">Business Name</th>
                <th className="p-3">Workspace ID</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-trust-100 font-medium">
              {filteredBusinesses.map(b => (
                <tr key={b.id} className="hover:bg-trust-50">
                  <td className="p-3 font-bold text-trust-900 flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-sapphire-600" />
                    <span>{b.name}</span>
                  </td>
                  <td className="p-3 font-mono text-trust-500">{b.workspaceId}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.subscriptionStatus === 'ACTIVE' ? 'badge-growth' : 'badge-focus'
                    }`}>
                      {b.subscriptionStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button className="px-3 py-1 bg-trust-800 hover:bg-trust-900 text-white rounded-lg text-[11px] font-bold">
                      Inspect Tenant
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-Tenant Audit Logs */}
      <div className="bg-white p-6 rounded-2xl border border-trust-200 shadow-psychology space-y-4">
        <h3 className="font-bold text-trust-900 text-base flex items-center space-x-2">
          <FileText className="w-5 h-5 text-trust-600" />
          <span>Platform Audit Trail</span>
        </h3>

        <div className="space-y-2">
          {auditLogs.map(log => (
            <div key={log.id} className="p-3 bg-trust-50 border border-trust-200 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-trust-400">{log.timestamp}</span>
                <span className="font-bold text-trust-900">{log.userName}</span>
                <span className="text-trust-600">{log.action}:</span>
                <span className="text-trust-800 italic">{log.details}</span>
              </div>
              <span className="text-[10px] bg-trust-200 text-trust-700 px-2 py-0.5 rounded font-mono">
                {log.businessId}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
