'use client';

import React, { useState, useMemo } from "react";
import {
  Search, Filter, ChevronDown, ChevronRight, Copy, Check,
  Clock, User, Tag, Database, Layers, ArrowUpDown
} from "lucide-react";

export interface AuditLogItem {
  _id: string;
  actorName: string;
  actorEmail?: string;
  actorPhone?: string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: any;
  afterState?: any;
  timestamp: string;
}

export default function AuditLogsTable({ logs }: { logs: AuditLogItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Extract unique action names
  const availableActions = useMemo(() => {
    const actions = new Set<string>();
    logs.forEach(l => {
      if (l.action) actions.add(l.action);
    });
    return Array.from(actions).sort();
  }, [logs]);

  // Extract unique entity types
  const availableEntityTypes = useMemo(() => {
    const types = new Set<string>();
    logs.forEach(l => {
      if (l.entityType) types.add(l.entityType);
    });
    return Array.from(types).sort();
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        searchQuery === "" ||
        log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.actorEmail && log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (log.actorPhone && log.actorPhone.includes(searchQuery)) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEntity =
        selectedEntityType === "all" || log.entityType === selectedEntityType;

      const matchesAction =
        selectedAction === "all" || log.action === selectedAction;

      return matchesSearch && matchesEntity && matchesAction;
    });
  }, [logs, searchQuery, selectedEntityType, selectedAction]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getEntityBadgeColor = (type: string) => {
    switch (type) {
      case "User":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Property":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "VibeUpgradeRequest":
        return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
      case "FeatureFlag":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "City":
      case "Locality":
      case "PointOfInterest":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "FacebookGroup":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, " ");
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by actor, action, entity ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center space-x-1.5 min-w-[150px]">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs border rounded-lg px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="all">All Entities ({logs.length})</option>
              {availableEntityTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {availableActions.length > 0 && (
            <div className="min-w-[160px]">
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs border rounded-lg px-2.5 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="all">All Actions</option>
                {availableActions.map((a) => (
                  <option key={a} value={a}>
                    {formatActionName(a)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(searchQuery || selectedEntityType !== "all" || selectedAction !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedEntityType("all");
                setSelectedAction("all");
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-brand-primary hover:underline px-2 py-1 whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 w-10"></th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Admin Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity Type</th>
                <th className="p-4">Entity Reference ID</th>
                <th className="p-4 text-right">State Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.map((log) => {
                const isExpanded = expandedId === log._id;
                const hasStates = log.beforeState || log.afterState;

                return (
                  <React.Fragment key={log._id}>
                    <tr
                      onClick={() => hasStates && toggleExpand(log._id)}
                      className={`transition-colors ${
                        hasStates ? "cursor-pointer hover:bg-slate-50/70" : "hover:bg-slate-50/40"
                      } ${isExpanded ? "bg-slate-50/90" : ""}`}
                    >
                      {/* Expand Toggle */}
                      <td className="p-4 text-slate-400">
                        {hasStates ? (
                          isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-slate-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )
                        ) : null}
                      </td>

                      {/* Timestamp */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-slate-800 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span>
                            {new Date(log.timestamp).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block ml-5">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </td>

                      {/* Admin Actor */}
                      <td className="p-4 space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900">{log.actorName}</span>
                          {log.actorRole && (
                            <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                              {log.actorRole}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {log.actorEmail || log.actorPhone || "System / Direct"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                          {formatActionName(log.action)}
                        </span>
                      </td>

                      {/* Entity Type */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getEntityBadgeColor(
                            log.entityType
                          )}`}
                        >
                          {log.entityType}
                        </span>
                      </td>

                      {/* Entity Reference ID */}
                      <td className="p-4">
                        <div className="flex items-center space-x-1.5">
                          <code className="text-[11px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                            {log.entityId}
                          </code>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(log.entityId, `entity-${log._id}`);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200/50 transition-colors"
                            title="Copy Entity ID"
                          >
                            {copiedId === `entity-${log._id}` ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* State Changes Indicator */}
                      <td className="p-4 text-right">
                        {hasStates ? (
                          <span className="text-[11px] font-semibold text-brand-primary hover:underline">
                            {isExpanded ? "Hide Details" : "View Diff & State"}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No State Captured</span>
                        )}
                      </td>
                    </tr>

                    {/* Expandable State Inspector */}
                    {isExpanded && hasStates && (
                      <tr className="bg-slate-50/60 border-t border-b border-slate-100">
                        <td colSpan={7} className="p-4 md:p-6">
                          <div className="space-y-4 max-w-5xl">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center">
                                <Database className="h-3.5 w-3.5 mr-1.5 text-brand-primary" />
                                State Snapshot Inspection ({log.entityType} - {log.entityId})
                              </h4>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(
                                    JSON.stringify(
                                      {
                                        logId: log._id,
                                        action: log.action,
                                        entityType: log.entityType,
                                        entityId: log.entityId,
                                        beforeState: log.beforeState,
                                        afterState: log.afterState,
                                      },
                                      null,
                                      2
                                    ),
                                    `all-${log._id}`
                                  )
                                }
                                className="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border px-2 py-1 rounded shadow-xs hover:bg-slate-50 transition-colors"
                              >
                                {copiedId === `all-${log._id}` ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span>Copied JSON</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 text-slate-400" />
                                    <span>Copy Full State JSON</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Before State */}
                              <div className="bg-white border rounded-xl p-4 shadow-xs">
                                <div className="flex items-center justify-between pb-2 mb-2 border-b">
                                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                    Before State
                                  </span>
                                  {log.beforeState && (
                                    <span className="text-[10px] text-slate-400">Previous</span>
                                  )}
                                </div>
                                {log.beforeState ? (
                                  <pre className="text-[11px] font-mono text-slate-800 bg-slate-50/70 p-3 rounded-lg overflow-x-auto max-h-72 leading-relaxed">
                                    {JSON.stringify(log.beforeState, null, 2)}
                                  </pre>
                                ) : (
                                  <div className="py-6 text-center text-xs text-slate-400 italic">
                                    No prior state (Creation / Initial state)
                                  </div>
                                )}
                              </div>

                              {/* After State */}
                              <div className="bg-white border rounded-xl p-4 shadow-xs">
                                <div className="flex items-center justify-between pb-2 mb-2 border-b">
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                    After State
                                  </span>
                                  {log.afterState && (
                                    <span className="text-[10px] text-slate-400">Updated</span>
                                  )}
                                </div>
                                {log.afterState ? (
                                  <pre className="text-[11px] font-mono text-slate-800 bg-slate-50/70 p-3 rounded-lg overflow-x-auto max-h-72 leading-relaxed">
                                    {JSON.stringify(log.afterState, null, 2)}
                                  </pre>
                                ) : (
                                  <div className="py-6 text-center text-xs text-slate-400 italic">
                                    No subsequent state recorded (Deletion)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-xs text-slate-400">
                    {logs.length === 0
                      ? "No audit log entries recorded yet."
                      : "No matching audit log entries found for current filter criteria."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border rounded-lg bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium"
              >
                Previous
              </button>
              <span className="px-2 font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border rounded-lg bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
