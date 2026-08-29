import dbConnect from "@/lib/db";
import City from "@/models/City";
import Locality from "@/models/Locality";
import PointOfInterest from "@/models/PointOfInterest";
import { 
  createCity, deleteCity, 
  createLocality, deleteLocality, 
  createPOI, deletePOI 
} from "./actions";
import { MapPin, Trash2, Plus, Landmark, Building, GraduationCap, Compass } from "lucide-react";
import React from "react";

export const dynamic = 'force-dynamic';

export default async function CitiesAdminPage() {
  await dbConnect();
  
  const cities = await City.find().sort({ name: 1 }).lean();
  const localities = await Locality.find().populate('cityId', 'name').sort({ name: 1 }).lean();
  const pois = await PointOfInterest.find()
    .populate('cityId', 'name')
    .populate('localityId', 'name')
    .sort({ name: 1 })
    .lean();

  const getPoiIcon = (type: string) => {
    switch (type) {
      case 'college': return <GraduationCap className="h-3.5 w-3.5 text-brand-primary" />;
      case 'office': return <Building className="h-3.5 w-3.5 text-sky-500" />;
      case 'transit': return <Compass className="h-3.5 w-3.5 text-brand-primary" />;
      default: return <Landmark className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Pune & Location Reference Data</h2>
        <p className="text-xs text-slate-500">Manage city configurations, residential nodes, and points of interest that drive the commute-distance search engine.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cities Column */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Add New City</h3>
            <form action={createCity as any} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">City Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required
                  placeholder="e.g. Pune" 
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">State</label>
                <input 
                  type="text" 
                  name="state" 
                  required
                  placeholder="e.g. Maharashtra" 
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create City</span>
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Active Cities ({cities.length})</h3>
            <div className="divide-y divide-gray-100 overflow-y-auto max-h-[300px]">
              {cities.map((city: any) => (
                <div key={city._id.toString()} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{city.name}</p>
                    <span className="text-[10px] text-slate-400">{city.state}</span>
                  </div>
                  <form action={deleteCity.bind(null, city._id.toString()) as any}>
                    <button type="submit" className="text-slate-400 hover:text-red-500 transition-colors p-1.5">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Localities Column */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Add New Locality</h3>
            <form action={createLocality as any} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Target City</label>
                <select name="cityId" required className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary">
                  {cities.map((c: any) => (
                    <option key={c._id.toString()} value={c._id.toString()}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Locality Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required
                  placeholder="e.g. Baner" 
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Latitude</label>
                  <input 
                    type="number" 
                    step="0.000001" 
                    name="lat" 
                    required
                    placeholder="e.g. 18.5597" 
                    className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Longitude</label>
                  <input 
                    type="number" 
                    step="0.000001" 
                    name="lng" 
                    required
                    placeholder="e.g. 73.7922" 
                    className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Locality</span>
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Localities ({localities.length})</h3>
            <div className="divide-y divide-gray-100 overflow-y-auto max-h-[300px] pr-1">
              {localities.map((loc: any) => (
                <div key={loc._id.toString()} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-brand-primary" />
                      <p className="text-xs font-bold text-slate-800">{loc.name}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      City: {loc.cityId?.name} | [{loc.location.coordinates[1]}, {loc.location.coordinates[0]}]
                    </span>
                  </div>
                  <form action={deleteLocality.bind(null, loc._id.toString()) as any}>
                    <button type="submit" className="text-slate-400 hover:text-red-500 transition-colors p-1.5">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Points of Interest Column */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Add New Landmark POI</h3>
            <form action={createPOI as any} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Target City</label>
                <select name="cityId" required className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary">
                  {cities.map((c: any) => (
                    <option key={c._id.toString()} value={c._id.toString()}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Locality (Optional)</label>
                  <select name="localityId" className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary">
                    <option value="">None (Generic)</option>
                    {localities.map((l: any) => (
                      <option key={l._id.toString()} value={l._id.toString()}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Category Type</label>
                  <select name="type" required className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary">
                    <option value="landmark">Landmark</option>
                    <option value="college">College</option>
                    <option value="office">Office/IT Park</option>
                    <option value="transit">Transit Hub</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">POI Landmark Name</label>
                <input 
                  type="text" 
                  name="name" 
                  required
                  placeholder="e.g. Phoenix Marketcity Mall" 
                  className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Latitude</label>
                  <input 
                    type="number" 
                    step="0.000001" 
                    name="lat" 
                    required
                    placeholder="e.g. 18.5622" 
                    className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Longitude</label>
                  <input 
                    type="number" 
                    step="0.000001" 
                    name="lng" 
                    required
                    placeholder="e.g. 73.9168" 
                    className="w-full text-xs border rounded-lg px-3 py-2 outline-brand-primary bg-slate-50"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-brand-primary hover:bg-brand-primaryHover text-white rounded-lg py-2 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create POI</span>
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Points of Interest ({pois.length})</h3>
            <div className="divide-y divide-gray-100 overflow-y-auto max-h-[300px] pr-1">
              {pois.map((poi: any) => (
                <div key={poi._id.toString()} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      {getPoiIcon(poi.type)}
                      <p className="text-xs font-bold text-slate-800 leading-tight">{poi.name}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Locality: {poi.localityId?.name || "Generic"} | Cat: {poi.type} | [{poi.location.coordinates[1]}, {poi.location.coordinates[0]}]
                    </span>
                  </div>
                  <form action={deletePOI.bind(null, poi._id.toString()) as any}>
                    <button type="submit" className="text-slate-400 hover:text-red-500 transition-colors p-1.5 flex-shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
