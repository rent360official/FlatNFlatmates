import dbConnect from "@/lib/db";
import User from "@/models/User";
import { adminCreateUser } from "./actions";
import UserRow from "./UserRow";
import { Users, Plus } from "lucide-react";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function UsersAdminPage() {
  await dbConnect();
  
  const users = await User.find().sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">User Profiles & Onboarding Control</h2>
        <p className="text-xs text-slate-500">Inspect registered users, onboard landlords/tenants on their behalf, and modify access privileges or verification statuses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Onboard Form */}
        <div className="lg:col-span-4">
          <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
              <Plus className="mr-2 h-4 w-4 text-brand-primary" />
              Onboard User (On-Behalf)
            </h3>
            <form action={adminCreateUser as any} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required
                  placeholder="e.g. Rajesh Kumar" 
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Phone Number</label>
                <input 
                  type="text" 
                  name="phone" 
                  required
                  placeholder="e.g. 9876543210" 
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Email Address (Optional)</label>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="e.g. rajesh@example.com" 
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Account Role</label>
                <select name="role" required className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary">
                  <option value="owner">Owner / Landlord</option>
                  <option value="user">User / Roommate Seeker</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2.5 text-xs font-semibold transition-colors"
              >
                Onboard Account
              </button>
            </form>
          </div>
        </div>

        {/* Users List */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
              <Users className="mr-2 h-4 w-4 text-brand-primary" />
              Registered Accounts ({users.length})
            </h3>
            
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Phone</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Verification</th>
                    <th className="py-2.5 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.map((u: any) => (
                    <UserRow key={u._id.toString()} user={JSON.parse(JSON.stringify(u))} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
