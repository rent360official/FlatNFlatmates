'use client';

import React, { useState, useTransition } from 'react';
import {
  saveFacebookGroup,
  toggleFacebookGroupStatus,
  deleteFacebookGroup
} from './actions';
import {
  Share2, Plus, Edit2, Trash2, ExternalLink, Check,
  Search, Shield, Info, CheckCircle2, X, AlertTriangle
} from 'lucide-react';

interface LocalityGroupItem {
  localityId: string;
  localityName: string;
  group?: {
    _id: string;
    groupName: string;
    groupUrl: string;
    description?: string;
    memberCount?: string;
    isActive: boolean;
    updatedAt?: string;
  } | null;
}

export default function FacebookGroupsManager({
  localitiesWithGroups,
  canEdit,
}: {
  localitiesWithGroups: LocalityGroupItem[];
  canEdit: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConfigured, setFilterConfigured] = useState<'all' | 'configured' | 'unconfigured'>('all');
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [activeModalItem, setActiveModalItem] = useState<LocalityGroupItem | null>(null);
  const [modalGroupName, setModalGroupName] = useState('');
  const [modalGroupUrl, setModalGroupUrl] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalMemberCount, setModalMemberCount] = useState('');
  const [modalIsActive, setModalIsActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openConfigModal = (item: LocalityGroupItem) => {
    setActiveModalItem(item);
    setErrorMessage(null);
    if (item.group) {
      setModalGroupName(item.group.groupName);
      setModalGroupUrl(item.group.groupUrl);
      setModalDescription(item.group.description || '');
      setModalMemberCount(item.group.memberCount || '');
      setModalIsActive(item.group.isActive);
    } else {
      setModalGroupName(`Flat and Flatmates ${item.localityName}`);
      setModalGroupUrl('');
      setModalDescription(`Official community group for flats and flatmates in ${item.localityName}, Pune.`);
      setModalMemberCount('');
      setModalIsActive(true);
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalItem) return;
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('localityId', activeModalItem.localityId);
    formData.append('groupName', modalGroupName);
    formData.append('groupUrl', modalGroupUrl);
    formData.append('description', modalDescription);
    formData.append('memberCount', modalMemberCount);
    formData.append('isActive', modalIsActive ? 'true' : 'false');

    startTransition(async () => {
      const res = await saveFacebookGroup(formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setActiveModalItem(null);
      }
    });
  };

  const handleToggle = (groupId: string, currentStatus: boolean) => {
    if (!canEdit) return;
    startTransition(async () => {
      const res = await toggleFacebookGroupStatus(groupId, currentStatus);
      if (res.error) alert(res.error);
    });
  };

  const handleDelete = (groupId: string, localityName: string) => {
    if (!canEdit) return;
    if (!confirm(`Are you sure you want to remove the Facebook group configuration for ${localityName}?`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteFacebookGroup(groupId);
      if (res.error) alert(res.error);
    });
  };

  const filteredItems = localitiesWithGroups.filter((item) => {
    const matchesSearch = item.localityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.group?.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    if (filterConfigured === 'configured') return matchesSearch && !!item.group;
    if (filterConfigured === 'unconfigured') return matchesSearch && !item.group;
    return matchesSearch;
  });

  const configuredCount = localitiesWithGroups.filter(l => !!l.group && l.group.isActive).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Localities</span>
          <span className="text-xl font-extrabold text-slate-800">{localitiesWithGroups.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active Configured Groups</span>
          <span className="text-xl font-extrabold text-emerald-700">{configuredCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Configuration</span>
          <span className="text-xl font-extrabold text-slate-500">{localitiesWithGroups.length - configuredCount}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search locality or group name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border rounded-lg bg-slate-50 outline-brand-primary font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setFilterConfigured('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterConfigured === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({localitiesWithGroups.length})
          </button>
          <button
            onClick={() => setFilterConfigured('configured')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterConfigured === 'configured' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Configured ({localitiesWithGroups.filter(l => !!l.group).length})
          </button>
          <button
            onClick={() => setFilterConfigured('unconfigured')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterConfigured === 'unconfigured' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Unconfigured ({localitiesWithGroups.filter(l => !l.group).length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50/75 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="py-3 px-4">Locality</th>
                <th className="py-3 px-4">Group Name & Link</th>
                <th className="py-3 px-4">Members</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {filteredItems.map((item) => (
                <tr key={item.localityId} className="hover:bg-slate-50/50 transition-colors">
                  {/* Locality */}
                  <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {item.localityName}
                  </td>

                  {/* Group Name & URL */}
                  <td className="py-3.5 px-4 max-w-xs">
                    {item.group ? (
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                          <Share2 className="h-3.5 w-3.5 text-[#1877F2] flex-shrink-0" />
                          <span className="truncate">{item.group.groupName}</span>
                        </div>
                        <a
                          href={item.group.groupUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#1877F2] hover:underline flex items-center space-x-1 truncate max-w-sm"
                        >
                          <span className="truncate">{item.group.groupUrl}</span>
                          <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No Facebook group configured</span>
                    )}
                  </td>

                  {/* Member Count */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                    {item.group?.memberCount || <span className="text-slate-300">—</span>}
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {item.group ? (
                      <button
                        type="button"
                        onClick={() => item.group && handleToggle(item.group._id, item.group.isActive)}
                        disabled={!canEdit || isPending}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                          item.group.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${item.group.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{item.group.isActive ? 'Active & Live' : 'Hidden'}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border">
                        Unconfigured
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openConfigModal(item)}
                        disabled={!canEdit || isPending}
                        className="inline-flex items-center space-x-1 bg-white border border-slate-200 hover:border-[#1877F2] hover:text-[#1877F2] text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        {item.group ? <Edit2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        <span>{item.group ? 'Edit' : 'Configure'}</span>
                      </button>

                      {item.group && (
                        <button
                          type="button"
                          onClick={() => item.group && handleDelete(item.group._id, item.localityName)}
                          disabled={!canEdit || isPending}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                          title="Remove group configuration"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-xs text-slate-400">
                    No localities found matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 font-sans">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Share2 className="h-4 w-4 text-[#1877F2]" />
                  <span>Configure Facebook Group: {activeModalItem.localityName}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set up the Facebook community group URL for users looking in this locality.
                </p>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Group Title / Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalGroupName}
                  onChange={(e) => setModalGroupName(e.target.value)}
                  placeholder="e.g. Flat and Flatmates Hinjewadi"
                  className="w-full text-xs font-medium border rounded-lg px-3 py-2 bg-slate-50 outline-[#1877F2]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Facebook Group URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={modalGroupUrl}
                  onChange={(e) => setModalGroupUrl(e.target.value)}
                  placeholder="https://www.facebook.com/groups/..."
                  className="w-full text-xs font-medium border rounded-lg px-3 py-2 bg-slate-50 outline-[#1877F2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Estimated Members (Optional)
                  </label>
                  <input
                    type="text"
                    value={modalMemberCount}
                    onChange={(e) => setModalMemberCount(e.target.value)}
                    placeholder="e.g. 15,000+ members"
                    className="w-full text-xs font-medium border rounded-lg px-3 py-2 bg-slate-50 outline-[#1877F2]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Display Status
                  </label>
                  <select
                    value={modalIsActive ? 'true' : 'false'}
                    onChange={(e) => setModalIsActive(e.target.value === 'true')}
                    className="w-full text-xs font-semibold border rounded-lg px-3 py-2 bg-slate-50 outline-[#1877F2]"
                  >
                    <option value="true">Active & Visible</option>
                    <option value="false">Hidden / Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description / Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Brief note about the locality community..."
                  className="w-full text-xs font-medium border rounded-lg px-3 py-2 bg-slate-50 outline-[#1877F2] resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveModalItem(null)}
                  disabled={isPending}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#1877F2] hover:bg-[#166fe5] text-white px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{isPending ? 'Saving...' : 'Save Group Config'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
