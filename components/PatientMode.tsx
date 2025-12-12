import React, { useState, useRef, useEffect } from 'react';
import { Search, Camera, Mic, MapPin, AlertCircle, Pill, Stethoscope, ChevronRight, Home, Upload, Heart, History, X, User as UserIcon, Trash2, Download, RefreshCw, Eye, Star, Phone, Calendar, Navigation, CheckCircle, Shield, Radio, Menu, Bell, HelpCircle } from 'lucide-react';
import { analyzePatientCase, getDoctorProfile, updateDoctorsList } from '../services/geminiService';
import { PatientResponse, AnalysisStatus, UserProfile, HistoryItem, DoctorProfile } from '../types';

interface PatientModeProps {
  onHome: () => void;
  onAccount: () => void;
  user: UserProfile | null;
}

export const PatientMode: React.FC<PatientModeProps> = ({ onHome, onAccount, user }) => {
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<PatientResponse | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [locationConsent, setLocationConsent] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isTrackingDoctors, setIsTrackingDoctors] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'history' | 'bookings'>('search');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (user && user.type !== 'guest') {
      const saved = localStorage.getItem(`medicrew_patient_history_${user.id}`);
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse history", e);
        }
      }
    } else {
      setHistory([]);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.type !== 'guest') {
      localStorage.setItem(`medicrew_patient_history_${user.id}`, JSON.stringify(history));
    }
  }, [history, user]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTrackingDoctors && result && userLocation && locationConsent === 'granted') {
       interval = setInterval(async () => {
          try {
             const updates = await updateDoctorsList(userLocation, result.parsed_summary || input);
             if (updates.nearby_doctors_list) {
                setResult(prev => prev ? {
                   ...prev,
                   nearby_doctors_list: updates.nearby_doctors_list,
                   real_time_tracking: updates.real_time_tracking
                } : null);
             }
          } catch (e) {
             console.error("Tracking update failed", e);
          }
       }, 15000); 
    }
    return () => clearInterval(interval);
  }, [isTrackingDoctors, result, userLocation, locationConsent, input]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].size > 10 * 1024 * 1024) {
        alert("Image too large. Max 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition(
          (position) => {
             setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
             setLocationConsent('granted');
          },
          (err) => {
             console.error(err);
             setLocationConsent('denied');
          }
       );
    } else {
       setLocationConsent('denied');
    }
  };

  const handleSearch = async () => {
    if (!input.trim() && images.length === 0) return;
    setStatus('processing');
    try {
      const loc = locationConsent === 'granted' ? userLocation : undefined;
      const response = await analyzePatientCase(input, images, undefined, loc);
      setResult(response);
      setStatus('success');
      
      if (loc) setIsTrackingDoctors(true);
      
      if (response.can_save_history && user && user.type !== 'guest') {
        const newItem: HistoryItem = {
           id: response.history_id || `hist-${Date.now()}`,
           timestamp: new Date().toISOString(),
           query_summary: input.substring(0, 60) + (input.length > 60 ? "..." : ""),
           type: 'patient',
           data: response
        };
        setHistory(prev => [newItem, ...prev]);
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleViewProfile = async (doctorId: string) => {
     setLoadingProfile(true);
     try {
        const profile = await getDoctorProfile(doctorId, input);
        setSelectedDoctorProfile(profile);
     } catch (e) {
        console.error(e);
     } finally {
        setLoadingProfile(false);
     }
  };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleExportHistory = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([JSON.stringify(item.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicrew-patient-${new Date(item.timestamp).toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadHistory = (item: HistoryItem) => {
    const data = item.data as PatientResponse;
    setResult(data);
    setInput(data.user_input_raw || "");
    setShowHistory(false);
    setActiveTab('search');
  };

  return (
    <div className="min-h-screen relative z-10 flex flex-col bg-black text-white pb-20 md:pb-0">
      
      {/* 1. PRIMARY NAVIGATION (Top Bar) - B&W */}
      <header className="sticky top-0 z-50 bg-black border-b border-white px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={onHome}>
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-sm">
            <Home size={18} />
          </div>
          <span className="font-bold text-lg text-white hidden md:block tracking-tighter">MEDICREW</span>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-2xl relative">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={18} />
              <input 
                ref={searchInputRef}
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search symptoms, doctors, or history... (Press '/')"
                className="w-full pl-10 pr-12 py-2.5 bg-black border border-gray-700 rounded-none focus:border-white focus:ring-1 focus:ring-white outline-none transition-all text-sm font-mono text-white placeholder:text-gray-600"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                 {input && (
                    <button onClick={() => setInput('')} className="p-1 hover:bg-gray-800 rounded-full text-gray-500">
                       <X size={14} />
                    </button>
                 )}
                 <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-900 transition-colors" title="Upload Image">
                    <Camera size={16} />
                 </button>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>
           </div>
        </div>

        {/* Right: Icon Cluster */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
           <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-full hidden md:flex relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full"></span>
           </button>
           <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-full hidden md:flex">
              <HelpCircle size={20} />
           </button>
           <div className="h-6 w-[1px] bg-gray-700 hidden md:block"></div>
           <button 
             onClick={onAccount}
             className="flex items-center gap-2 hover:bg-gray-900 p-1.5 transition-colors border border-transparent hover:border-gray-700"
           >
              <div className="w-8 h-8 bg-gray-900 border border-gray-600 flex items-center justify-center text-gray-300 font-bold overflow-hidden">
                 {user?.profilePicUrl ? <img src={user.profilePicUrl} className="w-full h-full object-cover" /> : <UserIcon size={16} />}
              </div>
              <span className="text-sm font-bold text-white hidden md:block max-w-[100px] truncate">{user?.name || 'Guest'}</span>
           </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
         
         {/* 3. CONTEXTUAL SIDEBAR (Left - Desktop Only) */}
         <aside className="w-64 hidden lg:block border-r border-white/20 p-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
            <nav className="space-y-1 mb-8">
               <button 
                  onClick={() => setActiveTab('search')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'search' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
               >
                  <Search size={16} /> Search
               </button>
               <button 
                  onClick={() => { setActiveTab('history'); setShowHistory(true); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'history' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
               >
                  <History size={16} /> History
               </button>
               <button 
                  onClick={() => setActiveTab('bookings')}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'bookings' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
               >
                  <Calendar size={16} /> Bookings
               </button>
            </nav>

            {/* Quick Filters */}
            <div className="pt-6 border-t border-white/10">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quick Filters</h3>
               <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white">
                     <input type="checkbox" className="rounded-none border-gray-600 bg-black checked:bg-white checked:border-white" />
                     Teleconsult Available
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white">
                     <input type="checkbox" className="rounded-none border-gray-600 bg-black checked:bg-white checked:border-white" />
                     Open Now
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white">
                     <input type="checkbox" className="rounded-none border-gray-600 bg-black checked:bg-white checked:border-white" />
                     Within 5km
                  </label>
               </div>
            </div>
         </aside>

         {/* MAIN CONTENT AREA */}
         <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            
            {/* Location & Context Bar */}
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-2 text-sm text-gray-400">
                  <MapPin size={16} />
                  {locationConsent === 'granted' ? <span className="text-white font-bold uppercase">Location Active</span> : <span>Location not shared</span>}
                  {locationConsent !== 'granted' && (
                     <button onClick={requestLocation} className="text-white underline text-xs font-bold ml-2 uppercase">Enable</button>
                  )}
               </div>
               {images.length > 0 && (
                  <div className="flex items-center gap-2 border border-white px-3 py-1 text-xs font-bold text-white uppercase">
                     <Upload size={12} /> {images.length} Image(s) Attached
                  </div>
               )}
            </div>

            {/* Empty State / Prompt */}
            {!result && status !== 'processing' && (
               <div className="text-center py-20 opacity-50">
                  <div className="border border-white/20 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                     <Search size={32} className="text-gray-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest">Start Consultation</h3>
                  <p className="text-sm text-gray-500 mt-2 font-mono">Describe symptoms or upload image for triage.</p>
               </div>
            )}

            {/* Processing State */}
            {status === 'processing' && (
               <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                  <div className="w-12 h-12 border-4 border-gray-800 border-t-white rounded-full animate-spin mb-6"></div>
                  <p className="font-bold text-white uppercase tracking-widest">Analyzing Case...</p>
               </div>
            )}

            {/* Results Output */}
            {result && (
               <div className="space-y-6 animate-slide-up">
                  
                  {/* Triage Card */}
                  <div className={`p-6 border ${result.triage_level === 'emergency' ? 'border-red-500 bg-red-900/10' : 'border-white bg-black'} shadow-glow`}>
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <AlertCircle size={24} className={result.triage_level === 'emergency' ? 'text-red-500' : 'text-white'} />
                           <h2 className="text-xl font-bold uppercase tracking-widest">Assessment: {result.triage_level.replace('_', ' ')}</h2>
                        </div>
                     </div>
                     <p className="text-base leading-relaxed mb-4 font-mono text-gray-300">{result.notes_for_user}</p>
                     
                     {/* Red Flags Inline */}
                     {result.red_flag_matches?.length > 0 && (
                        <div className="border border-red-900 p-3 mb-4 bg-red-900/10">
                           <p className="text-xs font-bold uppercase mb-2 text-red-500">Critical Alerts</p>
                           <ul className="space-y-1">
                              {result.red_flag_matches.map((flag: any, i) => (
                                 <li key={i} className="text-sm font-bold flex items-center gap-2 text-red-400">
                                    <span className="w-1.5 h-1.5 bg-red-500"></span>
                                    {typeof flag === 'string' ? flag : (flag.flag || flag.description)}
                                 </li>
                              ))}
                           </ul>
                        </div>
                     )}

                     {/* Action Buttons */}
                     <div className="flex gap-3 mt-6">
                        <button className="bg-white text-black border border-white px-4 py-2 text-sm font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors">
                           Save to History
                        </button>
                        <button className="bg-black text-white border border-white px-4 py-2 text-sm font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors">
                           Share Result
                        </button>
                     </div>
                  </div>

                  {/* Two Column Layout for Details */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                     
                     {/* First Aid */}
                     {result.first_aid_instructions?.length > 0 && (
                        <div className="bg-black border border-white p-6 shadow-glow">
                           <h3 className="font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
                              <Heart size={16} className="text-white" /> First Aid
                           </h3>
                           <ul className="space-y-3">
                              {result.first_aid_instructions.map((inst, i) => (
                                 <li key={i} className="flex gap-3 text-sm text-gray-300 font-mono">
                                    <div className="mt-1.5 w-1.5 h-1.5 bg-white shrink-0"></div>
                                    {inst}
                                 </li>
                              ))}
                           </ul>
                        </div>
                     )}

                     {/* Medications */}
                     {result.medication_suggestions?.length > 0 && (
                        <div className="bg-black border border-white p-6 shadow-glow">
                           <h3 className="font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
                              <Pill size={16} className="text-white" /> Suggestions (OTC)
                           </h3>
                           <div className="space-y-3">
                              {result.medication_suggestions.map((med, i) => (
                                 <div key={i} className="border border-gray-800 p-3 hover:border-white transition-colors">
                                    <div className="flex justify-between items-center mb-1">
                                       <span className="font-bold text-white uppercase">{med.name}</span>
                                       <span className="text-[10px] border border-white px-2 py-0.5 font-bold">{(med.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-mono">{med.purpose} • <span className="text-white">{med.typical_dose}</span></p>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Doctors List */}
                  {result.nearby_doctors_list && result.nearby_doctors_list.length > 0 && (
                     <div className="bg-black border border-white shadow-glow">
                        <div className="p-4 border-b border-white bg-white/5 flex justify-between items-center">
                           <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                              <Stethoscope size={16} /> Nearby Clinicians
                           </h3>
                           {isTrackingDoctors && (
                              <span className="text-[10px] bg-white text-black px-2 py-0.5 font-bold uppercase animate-pulse">Live Updates</span>
                           )}
                        </div>
                        <div className="divide-y divide-gray-800">
                           {result.nearby_doctors_list.map((doc, i) => (
                              <div key={i} className="p-4 hover:bg-white/5 transition-colors flex items-center gap-4 group cursor-pointer" onClick={() => handleViewProfile(doc.doctor_id)}>
                                 <div className="w-12 h-12 bg-gray-900 border border-gray-700 flex-shrink-0 flex items-center justify-center">
                                    {doc.profile_pic_thumbnail_url ? <img src={doc.profile_pic_thumbnail_url} className="w-full h-full object-cover" /> : <UserIcon className="text-gray-500" />}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white truncate group-hover:text-gray-300 transition-colors uppercase tracking-wider">{doc.name}</h4>
                                    <p className="text-xs text-gray-500 truncate font-mono">{doc.primary_specialty} • {doc.distance_km}km</p>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white border border-white px-2 py-1 hidden sm:block uppercase">{doc.availability_summary}</span>
                                    <ChevronRight size={16} className="text-gray-500 group-hover:text-white" />
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  <p className="text-center text-[10px] text-gray-500 uppercase tracking-widest pb-10">{result.disclaimer}</p>
               </div>
            )}
         </main>

         {/* 3. CONTEXTUAL SIDEBAR (Right - Desktop Only, Summary) */}
         {result && (
            <aside className="w-72 hidden xl:block border-l border-white/20 p-6 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Case Summary</h3>
               <div className="border border-white/20 p-4 mb-6">
                  <p className="text-sm font-bold text-white mb-2 uppercase">Patient Snapshot</p>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">{result.case_summary_for_doctor}</p>
               </div>
               
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quick Actions</h3>
               <div className="space-y-2">
                  <button className="w-full py-2 border border-white text-xs font-bold text-white hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
                     <Download size={14} /> Export PDF
                  </button>
                  <button className="w-full py-2 border border-white text-xs font-bold text-white hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
                     <RefreshCw size={14} /> Re-Analyze
                  </button>
               </div>
            </aside>
         )}
      </div>

      {/* 4. MOBILE BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/30 h-16 flex items-center justify-around px-2 z-50 md:hidden pb-safe">
         <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'search' ? 'text-white' : 'text-gray-500'}`}>
            <Search size={20} />
            <span className="text-[10px] font-bold uppercase">Search</span>
         </button>
         <button onClick={() => { setActiveTab('history'); setShowHistory(true); }} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'history' ? 'text-white' : 'text-gray-500'}`}>
            <History size={20} />
            <span className="text-[10px] font-bold uppercase">History</span>
         </button>
         <button onClick={() => setActiveTab('bookings')} className={`flex flex-col items-center gap-1 p-2 ${activeTab === 'bookings' ? 'text-white' : 'text-gray-500'}`}>
            <Calendar size={20} />
            <span className="text-[10px] font-bold uppercase">Bookings</span>
         </button>
         <button onClick={onAccount} className="flex flex-col items-center gap-1 p-2 text-gray-500">
            <UserIcon size={20} />
            <span className="text-[10px] font-bold uppercase">Account</span>
         </button>
      </nav>

      {/* Doctor Profile Modal - B&W */}
      {selectedDoctorProfile && !loadingProfile && (
         <div className="fixed inset-0 z-[100] bg-black overflow-y-auto animate-fade-in flex flex-col md:flex-row border-l border-white">
            <div className="sticky top-0 z-10 bg-black border-b border-white p-4 flex justify-between items-center md:hidden">
               <span className="font-bold text-white uppercase">Doctor Profile</span>
               <button onClick={() => setSelectedDoctorProfile(null)} className="text-white"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-12 text-white">
                <button onClick={() => setSelectedDoctorProfile(null)} className="hidden md:flex absolute top-6 right-6 p-2 hover:bg-white hover:text-black rounded-full transition-colors"><X size={24} /></button>
                <div className="max-w-4xl mx-auto">
                   <div className="flex flex-col md:flex-row gap-8 mb-8 border-b border-white/20 pb-8">
                      <div className="w-32 h-32 border border-white flex items-center justify-center bg-black">
                         {selectedDoctorProfile.profile_pic_url ? <img src={selectedDoctorProfile.profile_pic_url} className="w-full h-full object-cover" /> : <UserIcon size={48} className="text-gray-500" />}
                      </div>
                      <div>
                         <h1 className="text-3xl font-bold mb-2 uppercase tracking-wide">{selectedDoctorProfile.full_name}</h1>
                         <p className="text-lg text-gray-400 mb-4 font-mono">{selectedDoctorProfile.headline}</p>
                         <div className="flex flex-wrap gap-2 mb-6">
                            {selectedDoctorProfile.specialties?.map((s:any, i) => <span key={i} className="border border-white px-3 py-1 text-xs font-bold uppercase">{typeof s === 'string' ? s : s.name}</span>)}
                         </div>
                      </div>
                   </div>
                   {/* ... Content ... */}
                </div>
            </div>
            
            {/* Right Sticky Booking Panel */}
            <div className="w-full md:w-96 bg-black border-l border-white p-6 flex flex-col gap-4">
               <h3 className="font-bold text-white uppercase tracking-widest text-xs">Book Appointment</h3>
               <div className="border border-white p-4">
                  <div className="flex justify-between mb-2">
                     <span className="text-sm font-bold text-gray-400 uppercase">Next Available</span>
                     <span className="text-sm font-bold text-white">Today, 2:00 PM</span>
                  </div>
                  <button className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-300 transition-colors">
                     Book Now
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* History Modal */}
      {showHistory && (
         <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
            <div className="p-4 border-b border-white flex justify-between items-center bg-black">
               <h2 className="text-xl font-bold text-white uppercase tracking-widest">History</h2>
               <button onClick={() => setShowHistory(false)} className="text-white"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
               <div className="max-w-3xl mx-auto space-y-4">
                  {history.map(item => (
                     <div key={item.id} onClick={() => handleLoadHistory(item)} className="border border-white p-4 cursor-pointer hover:bg-white hover:text-black transition-colors group">
                        <div className="flex justify-between mb-2">
                           <span className="text-xs font-bold text-gray-500 group-hover:text-black/60">{new Date(item.timestamp).toLocaleString()}</span>
                           <span className={`text-[10px] px-2 py-0.5 border font-bold uppercase ${(item.data as PatientResponse).triage_level === 'emergency' ? 'border-red-500 text-red-500' : 'border-current'}`}>{(item.data as PatientResponse).triage_level}</span>
                        </div>
                        <p className="text-sm font-bold uppercase tracking-wide line-clamp-2">{item.query_summary}</p>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}

    </div>
  );
};