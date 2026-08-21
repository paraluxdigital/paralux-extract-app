import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { subscribeToUserUsageLogs } from '../services/firebase';

export interface UsageLogItem {
  extractionId: string;
  userId: string;
  apiKeyId?: string | null;
  documentType: string;
  extractionMode: 1 | 2;
  model: string;
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
  thoughtsTokens?: number;
  cachedContentTokens?: number;
  creditsDeducted: number;
  executionTimeMs: number;
  timestamp: number;
  status: 'success' | 'failed';
  errorMessage?: string;
}

export const UsageLogsManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<UsageLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<UsageLogItem | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserUsageLogs(currentUser.uid, (data) => {
      setLogs(data as UsageLogItem[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Aggregate metrics
  const totalExtractions = logs.length;
  const totalTokens = logs.reduce((acc, l) => acc + (l.totalTokens || 0), 0);
  const totalPromptTokens = logs.reduce((acc, l) => acc + (l.promptTokens || 0), 0);
  const totalCandidateTokens = logs.reduce((acc, l) => acc + (l.candidatesTokens || 0), 0);
  const totalCreditsDeducted = logs.reduce((acc, l) => acc + (l.creditsDeducted || 0), 0);
  const avgLatency =
    totalExtractions > 0
      ? Math.round(logs.reduce((acc, l) => acc + (l.executionTimeMs || 0), 0) / totalExtractions)
      : 0;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchFilter ||
      log.extractionId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (log.documentType && log.documentType.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesMode =
      modeFilter === 'all' || log.extractionMode.toString() === modeFilter;
    return matchesSearch && matchesMode;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header & Description */}
      <div className="bg-[#202734] border border-[#4a5568] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-80 h-32 bg-[#dd6b20]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col gap-1 z-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#dd6b20] text-xl">analytics</span>
            <h2 className="text-xl sm:text-2xl font-display font-black text-[#f7fafc]">
              Telemetry & Token Consumption
            </h2>
          </div>
          <p className="text-xs text-[#a0aec0] max-w-2xl leading-relaxed">
            Real-time server telemetry tracking exact token usage, prompt size, completion metrics, and API latency for each extraction request.
          </p>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-[#202734] border border-[#4a5568] rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-[#a0aec0]">
            <span className="text-[10px] font-mono uppercase font-bold">Total Tokens</span>
            <span className="material-symbols-outlined text-xs text-[#dd6b20]">token</span>
          </div>
          <span className="text-lg font-black font-mono text-[#f7fafc]">
            {totalTokens.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-[#a0aec0]">Across all requests</span>
        </div>

        <div className="bg-[#202734] border border-[#4a5568] rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-[#a0aec0]">
            <span className="text-[10px] font-mono uppercase font-bold">Prompt Tokens</span>
            <span className="material-symbols-outlined text-xs text-blue-400">input</span>
          </div>
          <span className="text-lg font-black font-mono text-blue-400">
            {totalPromptTokens.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-[#a0aec0]">Docs & Schema</span>
        </div>

        <div className="bg-[#202734] border border-[#4a5568] rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-[#a0aec0]">
            <span className="text-[10px] font-mono uppercase font-bold">Output Tokens</span>
            <span className="material-symbols-outlined text-xs text-emerald-400">output</span>
          </div>
          <span className="text-lg font-black font-mono text-emerald-400">
            {totalCandidateTokens.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-[#a0aec0]">Extracted JSON</span>
        </div>

        <div className="bg-[#202734] border border-[#4a5568] rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-[#a0aec0]">
            <span className="text-[10px] font-mono uppercase font-bold">Extractions</span>
            <span className="material-symbols-outlined text-xs text-amber-400">description</span>
          </div>
          <span className="text-lg font-black font-mono text-amber-400">
            {totalExtractions.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-[#a0aec0]">Processed</span>
        </div>

        <div className="bg-[#202734] border border-[#4a5568] rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-[#a0aec0]">
            <span className="text-[10px] font-mono uppercase font-bold">Credits Used</span>
            <span className="material-symbols-outlined text-xs text-[#dd6b20]">bolt</span>
          </div>
          <span className="text-lg font-black font-mono text-[#dd6b20]">
            {totalCreditsDeducted.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-[#a0aec0]">Billing units</span>
        </div>

        <div className="bg-[#202734] border border-[#4a5568] rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center justify-between text-[#a0aec0]">
            <span className="text-[10px] font-mono uppercase font-bold">Avg Latency</span>
            <span className="material-symbols-outlined text-xs text-purple-400">timer</span>
          </div>
          <span className="text-lg font-black font-mono text-purple-400">
            {avgLatency}ms
          </span>
          <span className="text-[10px] font-mono text-[#a0aec0]">Execution speed</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#202734] border border-[#4a5568] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="relative flex-1 w-full sm:w-auto">
          <span className="material-symbols-outlined text-sm text-[#a0aec0] absolute left-3 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search by Extraction ID or document category..."
            className="w-full bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-xl pl-9 pr-3.5 py-2 text-xs font-mono text-[#f7fafc] placeholder-[#718096] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-xl px-3 py-2 text-xs font-mono text-[#f7fafc] transition-colors cursor-pointer"
          >
            <option value="all">All Modes</option>
            <option value="1">Mode 1 (Standard)</option>
            <option value="2">Mode 2 (Advanced)</option>
          </select>
        </div>
      </div>

      {/* Telemetry Table */}
      <div className="bg-[#202734] border border-[#4a5568] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[#4a5568] bg-[#1a202c] text-[#a0aec0] uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Extraction ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Prompt Tokens</th>
                <th className="py-3 px-4">Output Tokens</th>
                <th className="py-3 px-4">Total Tokens</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4a5568]/40 text-[#f7fafc]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#a0aec0]">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[#dd6b20] animate-spin">progress_activity</span>
                      <span>Loading extraction logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#a0aec0]">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-[#4a5568]">
                      history_toggle_off
                    </span>
                    <span className="font-semibold text-sm block mb-1">No extraction logs recorded yet</span>
                    <span className="text-xs text-[#718096]">
                      Run extractions in the Schema Workbench or via API to inspect live telemetry.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.extractionId}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-[#2d3748] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-[#dd6b20]">
                      {log.extractionId}
                    </td>
                    <td className="py-3 px-4 text-[#a0aec0] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#1a202c] border border-[#4a5568] text-[11px] uppercase">
                        {log.documentType || 'general'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#dd6b20]/15 text-[#dd6b20] border border-[#dd6b20]/30 font-bold text-[10px]">
                        Mode {log.extractionMode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-blue-400">
                      {log.promptTokens?.toLocaleString() || 0}
                    </td>
                    <td className="py-3 px-4 text-emerald-400">
                      {log.candidatesTokens?.toLocaleString() || 0}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#f7fafc]">
                      {log.totalTokens?.toLocaleString() || 0}
                    </td>
                    <td className="py-3 px-4 text-purple-400">
                      {log.executionTimeMs || 0}ms
                    </td>
                    <td className="py-3 px-4 text-amber-400 font-bold">
                      {log.creditsDeducted} {log.creditsDeducted === 1 ? 'cr' : 'crs'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        200 OK
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#202734] border border-[#4a5568] rounded-3xl p-6 max-w-2xl w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#4a5568]">
              <div className="flex items-center gap-2 font-mono">
                <span className="material-symbols-outlined text-[#dd6b20]">analytics</span>
                <span className="font-bold text-sm text-[#f7fafc]">Telemetry: {selectedLog.extractionId}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#a0aec0] hover:text-[#f7fafc] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <pre className="bg-[#1a202c] p-4 rounded-xl border border-[#4a5568] text-xs font-mono text-[#f7fafc] overflow-x-auto max-h-96">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#2d3748] hover:bg-[#4a5568] text-[#f7fafc] rounded-xl text-xs font-bold font-mono transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
