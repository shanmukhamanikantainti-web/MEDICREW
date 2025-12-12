import React, { useState, useRef, useEffect } from 'react';
import { Search, FileText, Activity, ShieldCheck, AlertTriangle, ChevronDown, Download, ExternalLink, Home, Upload, Microscope, History, Clock, FileInput, CheckCircle, User, X, Trash2, Eye, Paperclip, ChevronRight, File, Shield, Pill, Stethoscope, ArrowRight, Bell, Menu, Grid, Layout, List } from 'lucide-react';
import { analyzeDoctorCase } from '../services/geminiService';
import { DoctorResponse, AnalysisStatus, UserProfile, HistoryItem } from '../types';

interface DoctorModeProps {
  onHome: () => void;
  onAccount: () => void;
  user: UserProfile | null;
}

interface UploadedFile {
  name: string;
  type: string;
  data: string; // Base64 full string
  displaySize: string;
}

export const DoctorMode: React.FC<DoctorModeProps> = ({ onHome, onAccount, user }) => {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<DoctorResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load History from LocalStorage
  useEffect(() => {
    if (user && user.type !== 'guest') {
      const saved = localStorage.getItem(`medicrew_doctor_history_${user.id}`);
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

  // Save History to LocalStorage
  useEffect(() => {
    if (user && user.type !== 'guest') {
      localStorage.setItem(`medicrew_doctor_history_${user.id}`, JSON.stringify(history));
    }
  }, [history, user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert("File too large. Max 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setUploadedFiles(prev => [...prev, {
            name: file.name,
            type: file.type,
            data: ev.target!.result as string,
            displaySize: (file.size / 1024 / 1024).toFixed(2) + ' MB'
          }]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleReport = (id: string) => {
    setExpandedReports(prev => ({...prev, [id]: !prev[id]}));
  };

  const handleAnalyze = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;
    setStatus('processing');
    try {
      const filesForService = uploadedFiles.map(f => ({
        name: f.name,
        mimeType: f.type,
        data: f.data.split(',')[1] 
      }));

      const response = await analyzeDoctorCase(input, filesForService);
      setResult(response);
      
      if (response.can_save_history && user && user.type !== 'guest') {
         const newItem: HistoryItem = {
            id: response.history_id || `hist-${Date.now()}`,
            timestamp: new Date().toISOString(),
            query_summary: input.substring(0, 80) + (input.length > 80 ? "..." : ""),
            type: 'doctor',
            data: response
         };
         setHistory(prev => [newItem, ...prev]);
      }
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleSelectHistory = (item: DoctorResponse) => {
    setResult(item);
    setInput(item.input_source.identifier || item.patient_summary || ""); 
    setUploadedFiles([]); 
  };

  // 1. License Check Block
  if (user && user.type === 'doctor' && !user.licenseFileId) {
     return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
           <div className="border border-white p-12 text-center max-w-lg shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <Shield size={64} className="mx-auto mb-6 text-white" />
              <h2 className="text-2xl font-bold uppercase tracking-widest mb-4">License Verification Required</h2>
              <p className="text-gray-400 font-mono mb-8">Access to the Clinician Workspace is restricted until a medical license is uploaded and verified.</p>
              <button 
                 onClick={onAccount}
                 className="bg-white text-black font-bold uppercase py-3 px-8 hover:bg-gray-300 transition-colors"
              >
                 Go to Account Upload
              </button>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen relative z-10 flex flex-col bg-black text-white">
      
      {/* 1. PRIMARY NAVIGATION (Header) */}
      <header className="px-6 h-16 flex items-center justify-between border-b border-white bg-black sticky top-0 z-50">
        <div className="flex items-center gap-4 cursor-pointer" onClick={onHome}>
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-sm font-bold text-xs tracking-tighter hover:bg-gray-300 transition-colors">
            MD
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base leading-none text-white tracking-tight">MEDICREW</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Clinician Workspace</span>
          </div>
        </div>

        {/* Center: Search / Command Bar */}
        <div className="hidden md:flex items-center bg-black border border-white/30 px-3 py-1.5 w-96 focus-within:border-white transition-all">
           <Search size={16} className="text-gray-500 mr-2" />
           <input 
             type="text" 
             placeholder="Search patient ID, condition... (/)" 
             className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-600 text-white font-mono"
           />
        </div>

        <div className="flex gap-3 items-center">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors relative">
               <Bell size={20} />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full"></span>
            </button>
            <div className="h-6 w-[1px] bg-white/20 mx-1"></div>
            <div 
               className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-2 py-1 transition-colors"
               onClick={onAccount}
            >
               <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold text-xs">
                  {user?.name?.[0] || 'D'}
               </div>
               <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-white uppercase">{user?.name || 'Clinician'}</p>
                  <p className="text-[9px] text-gray-500 uppercase font-medium">{user?.verificationStatus || 'Pending'}</p>
               </div>
            </div>
        </div>
      </header>

      {/* 2. THREE-PANE LAYOUT */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
        
        {/* LEFT PANE: Caseload / History Navigation */}
        <aside className={`${leftPanelOpen ? 'w-64' : 'w-16'} flex-shrink-0 border-r border-white/20 bg-black transition-all duration-300 flex flex-col`}>
           <div className="p-4 border-b border-white/20 flex justify-between items-center">
              {leftPanelOpen && <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Caseload</h3>}
              <button onClick={() => setLeftPanelOpen(!leftPanelOpen)} className="text-gray-500 hover:text-white"><Menu size={16} /></button>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4">
                 <button 
                   onClick={() => { setResult(null); setInput(''); setUploadedFiles([]); }}
                   className={`w-full py-2 bg-white text-black text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors uppercase tracking-wider ${!leftPanelOpen && 'px-0'}`}
                 >
                    <Grid size={16} /> {leftPanelOpen && 'New Case'}
                 </button>
              </div>

              <div className="px-2 space-y-1">
                 {history.slice(0, 20).map((item, idx) => (
                    <div 
                       key={item.id || idx}
                       onClick={() => handleSelectHistory(item.data as DoctorResponse)}
                       className={`p-3 cursor-pointer transition-all hover:bg-white/10 group border-b border-white/5 ${leftPanelOpen ? '' : 'flex justify-center'}`}
                    >
                       {leftPanelOpen ? (
                          <>
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-mono text-gray-500">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                {!!(item.data as DoctorResponse).treatment_pattern_detected?.pattern_id && <div className="w-1.5 h-1.5 bg-white"></div>}
                             </div>
                             <p className="text-xs text-gray-300 font-bold line-clamp-1 group-hover:text-white">{item.query_summary}</p>
                          </>
                       ) : (
                          <div className="w-8 h-8 border border-white/20 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:border-white group-hover:text-white">
                             {idx + 1}
                          </div>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        </aside>

        {/* CENTER PANE: Working Canvas */}
        <main className="flex-1 overflow-y-auto bg-black flex flex-col relative border-r border-white/20">
           
           {/* If no result, show input prominently in center */}
           {!result ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-3xl mx-auto w-full">
                 <div className="w-full bg-black p-8 border border-white shadow-glow">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center uppercase tracking-widest">Clinical Analysis Engine</h2>
                    
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Paste clinical notes, vitals, or symptoms here..."
                        className="w-full h-40 p-4 bg-black border border-white/30 focus:border-white outline-none transition-all resize-none text-sm font-mono text-white mb-4"
                    />
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div 
                           onClick={() => fileInputRef.current?.click()}
                           className="flex-1 h-12 border border-dashed border-white/30 flex items-center justify-center gap-2 cursor-pointer hover:border-white hover:bg-white/5 text-gray-400 hover:text-white transition-all text-xs font-bold uppercase"
                        >
                           <Upload size={16} /> Upload Reports
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileSelect} />
                    </div>

                    {uploadedFiles.length > 0 && (
                       <div className="flex flex-wrap gap-2 mb-6">
                          {uploadedFiles.map((f, i) => (
                             <div key={i} className="flex items-center gap-2 border border-white px-3 py-1 text-xs font-bold text-white uppercase">
                                <FileText size={12} /> {f.name} <X size={12} className="cursor-pointer hover:text-gray-400" onClick={() => removeFile(i)} />
                             </div>
                          ))}
                       </div>
                    )}

                    <button 
                       onClick={handleAnalyze}
                       disabled={status === 'processing'}
                       className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                       {status === 'processing' ? <Activity className="animate-spin" /> : <Search />}
                       {status === 'processing' ? 'PROCESSING...' : 'ANALYZE CASE'}
                    </button>
                 </div>
              </div>
           ) : (
              // Results View
              <div className="p-8 pb-24 max-w-4xl mx-auto w-full space-y-8 animate-fade-in text-white">
                 
                 {/* Top Status Bar */}
                 <div className="flex items-center justify-between border-b border-white pb-4">
                    <div>
                       <h2 className="text-xl font-bold uppercase tracking-widest text-white">Analysis Result</h2>
                       <p className="text-xs text-gray-500 font-mono">ID: {result.session_id}</p>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { setResult(null); setInput(''); }} className="px-4 py-2 border border-white hover:bg-white hover:text-black text-xs font-bold uppercase">New Case</button>
                       <button className="px-4 py-2 bg-white text-black hover:bg-gray-300 text-xs font-bold uppercase">Export Report</button>
                    </div>
                 </div>

                 {/* Alerts */}
                 {result.red_flags?.length > 0 && (
                    <div className="border border-red-500 p-4 bg-red-900/20 space-y-2">
                       {result.red_flags.map((flag, i) => (
                          <div key={i} className="flex gap-3 items-start">
                             <AlertTriangle className="text-red-500 shrink-0" size={20} />
                             <div>
                                <h4 className="font-bold text-red-500 text-sm uppercase">{flag.description}</h4>
                                <p className="text-xs text-gray-300 font-mono">{flag.suggested_action}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}

                 {/* 1. TREATMENT PROCEDURE */}
                 <section className="border border-white p-6">
                    <h3 className="text-lg font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Activity size={20} /> 1. Treatment Procedure
                    </h3>
                    <div className="space-y-6">
                       {result.treatment_procedure?.map((step, i) => (
                          <div key={i} className="flex gap-4">
                             <div className="w-8 h-8 border border-white flex items-center justify-center font-bold">{step.step_number}</div>
                             <div className="flex-1">
                                <p className="font-bold text-sm mb-2">{step.description}</p>
                                <div className="flex gap-4 text-xs font-mono text-gray-400">
                                   {step.time_required && <span>Time: {step.time_required}</span>}
                                   {step.risks?.length > 0 && <span className="text-red-400">Risks: {step.risks.join(', ')}</span>}
                                </div>
                             </div>
                          </div>
                       ))}
                       {(!result.treatment_procedure || result.treatment_procedure.length === 0) && (
                          <p className="text-gray-500 italic">No specific procedure generated.</p>
                       )}
                    </div>
                 </section>

                 {/* 2. MEDICATIONS DURING TREATMENT */}
                 <section className="border border-white p-6">
                    <h3 className="text-lg font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Pill size={20} /> 2. Treatment Medications
                    </h3>
                    <div className="space-y-4">
                       {result.medications_during_treatment?.map((med, i) => (
                          <div key={i} className="border border-white/30 p-4">
                             <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-lg">{med.drug_name}</h4>
                                <span className="text-xs border border-white px-2 py-1">{med.route}</span>
                             </div>
                             <div className="grid grid-cols-2 gap-4 text-sm font-mono text-gray-300 mb-2">
                                <p>Dose: {med.dosage}</p>
                                <p>Freq: {med.frequency}</p>
                                <p>Dur: {med.duration}</p>
                             </div>
                             <p className="text-xs text-gray-500 italic">{med.indication}</p>
                          </div>
                       ))}
                       {(!result.medications_during_treatment || result.medications_during_treatment.length === 0) && (
                          <p className="text-gray-500 italic">No treatment medications listed.</p>
                       )}
                    </div>
                 </section>

                 {/* 3. DISCHARGE INSTRUCTIONS */}
                 <section className="border border-white p-6">
                    <h3 className="text-lg font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                       <FileText size={20} /> 3. Discharge Plan
                    </h3>
                    <ul className="space-y-4">
                       {result.discharge_instructions?.map((inst, i) => (
                          <li key={i} className="flex gap-4 items-start">
                             <CheckCircle size={16} className="mt-1 shrink-0" />
                             <div>
                                <p className="font-bold text-sm">{inst.instruction}</p>
                                <p className="text-xs text-gray-400 font-mono">{inst.reason}</p>
                                {inst.warning_signs?.length > 0 && (
                                   <p className="text-xs text-red-400 mt-1 uppercase">Warning Signs: {inst.warning_signs.join(', ')}</p>
                                )}
                             </div>
                          </li>
                       ))}
                    </ul>
                 </section>

                 {/* 4. POST-DISCHARGE MEDICATIONS */}
                 <section className="border border-white p-6">
                    <h3 className="text-lg font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Home size={20} /> 4. Post-Discharge Meds
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {result.post_discharge_medications?.map((med, i) => (
                          <div key={i} className="border border-white/30 p-4">
                             <h4 className="font-bold">{med.drug_name}</h4>
                             <p className="text-sm font-mono text-gray-300 mt-1">{med.dosage} | {med.frequency}</p>
                             <p className="text-xs text-gray-500 mt-2">{med.instructions}</p>
                          </div>
                       ))}
                    </div>
                 </section>

                 {result.data_insufficiency_notes && (
                    <div className="border border-yellow-500 p-4 text-yellow-500 font-mono text-xs uppercase">
                       NOTE: {result.data_insufficiency_notes}
                    </div>
                 )}

              </div>
           )}
        </main>

        {/* RIGHT PANE: Evidence & Files */}
        <aside className={`${rightPanelOpen ? 'w-80' : 'w-12'} flex-shrink-0 bg-black transition-all duration-300 flex flex-col border-l border-white/20`}>
           <div className="p-4 border-b border-white/20 flex justify-between items-center">
              {rightPanelOpen && <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Evidence</h3>}
              <button onClick={() => setRightPanelOpen(!rightPanelOpen)} className="text-gray-500 hover:text-white"><Layout size={16} /></button>
           </div>

           {rightPanelOpen && (
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                 
                 {/* Search Evidence */}
                 <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                    <input type="text" placeholder="Search guidelines..." className="w-full pl-9 pr-3 py-2 bg-black border border-white/30 rounded-none text-xs focus:border-white outline-none text-white" />
                 </div>

                 {/* Parsed Reports */}
                 {result?.parsed_reports && result.parsed_reports.length > 0 && (
                    <div>
                       <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2 uppercase"><FileText size={14} /> Source Documents</h4>
                       <div className="space-y-3">
                          {result.parsed_reports.map((rep, i) => (
                             <div key={i} className="p-3 border border-white/20 hover:border-white cursor-pointer transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                   <span className="text-xs font-bold text-gray-300 truncate w-32">{rep.file_name}</span>
                                   <span className="text-[10px] border border-white/20 px-1.5 text-gray-500">{rep.report_type}</span>
                                </div>
                                <div className="space-y-1">
                                   {rep.extracted_entities?.slice(0, 3).map((ent, j) => (
                                      <div key={j} className="flex justify-between text-[10px]">
                                         <span className="text-gray-500 uppercase">{ent.name}</span>
                                         <span className={`font-mono ${ent.flag ? 'text-red-500 font-bold' : 'text-white'}`}>{ent.value} {ent.unit}</span>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {/* Citations */}
                 {result?.personalized_recommendations && (
                    <div>
                       <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2 uppercase"><List size={14} /> References</h4>
                       <div className="space-y-2">
                          {result.personalized_recommendations.flatMap(r => r.evidence || []).slice(0, 5).map((ev, i) => (
                             <a key={i} href={ev.url} target="_blank" className="block p-2 text-[10px] text-gray-400 border border-white/10 hover:border-white hover:text-white transition-colors">
                                <span className="font-bold block mb-0.5 uppercase">{ev.source}</span>
                                <span className="italic opacity-70 line-clamp-2">"{ev.excerpt}"</span>
                             </a>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           )}
        </aside>

      </div>
    </div>
  );
};