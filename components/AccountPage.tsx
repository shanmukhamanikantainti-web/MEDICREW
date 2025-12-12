import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { User, X, Camera, Edit2, Save, Shield, FileText, Lock, CheckCircle, RefreshCw, LogIn, UserPlus, LogOut, Upload } from 'lucide-react';

interface AccountPageProps {
  user: UserProfile | null;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onBack: () => void;
  onLoginRequest: () => void;
  onLogout: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ user, onUpdateUser, onBack, onLoginRequest, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(user || {
    id: '', type: 'guest', name: 'Guest', consents: { storeHistory: false, storeImages: false, locationAccess: false }
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const isGuest = user.type === 'guest';

  const handleSave = () => {
    onUpdateUser(formData);
    setIsEditing(false);
  };

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setFormData(prev => ({ ...prev, profilePicUrl: ev.target!.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Max 5MB.");
        return;
      }
      // Mock upload
      setFormData(prev => ({
         ...prev,
         licenseFileId: `lic_${Date.now()}_${file.name}`,
         verificationStatus: 'pending' // Reset to pending on new upload
      }));
      alert("License uploaded successfully. Verification pending.");
    }
  };

  const toggleConsent = (key: keyof NonNullable<UserProfile['consents']>) => {
    if (!isEditing) return;
    setFormData(prev => ({
      ...prev,
      consents: {
        ...prev.consents!,
        [key]: !prev.consents?.[key]
      }
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 relative z-50 overflow-y-auto">
      {/* Header */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-white/20">
        <h1 className="text-2xl font-bold flex items-center gap-3 tracking-widest uppercase">
          <User size={24} className="text-white" /> My Account
        </h1>
        <button onClick={onBack} className="p-2 hover:bg-white hover:text-black rounded-full transition-colors text-gray-400">
          <X size={24} />
        </button>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pb-24">
        
        {/* Left Column: Profile Pic & Key Info */}
        <div className="md:col-span-1 flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="w-48 h-48 border border-white overflow-hidden bg-black flex items-center justify-center">
              {formData.profilePicUrl ? (
                <img src={formData.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className="text-gray-500" />
              )}
            </div>
            {!isGuest && isEditing && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity border border-white"
              >
                <div className="flex flex-col items-center text-white">
                  <Camera size={24} />
                  <span className="text-xs font-bold mt-1 uppercase tracking-widest">Change</span>
                </div>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProfileUpload} />
          </div>

          <div className="text-center w-full">
             <h2 className="text-xl font-bold text-white uppercase tracking-wider">{formData.name}</h2>
             <p className="text-sm text-gray-500 font-mono mb-4">{formData.type.toUpperCase()}</p>
             
             {formData.type === 'doctor' && (
                <div className="bg-black border border-white/20 p-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                     <Shield size={14} className="text-white" />
                     <span className="text-xs font-bold uppercase text-white tracking-widest">Verification</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className={`text-xs uppercase px-2 py-0.5 border ${
                        formData.verificationStatus === 'verified' ? 'border-white text-white' : 'border-gray-600 text-gray-500'
                     }`}>
                        {formData.verificationStatus || 'Unverified'}
                     </span>
                  </div>
                </div>
             )}
          </div>

          {!isGuest && (
             <button 
               onClick={() => isEditing ? handleSave() : setIsEditing(true)}
               className={`w-full py-3 flex items-center justify-center gap-2 font-bold uppercase tracking-widest transition-all ${
                 isEditing 
                   ? 'bg-white text-black hover:bg-gray-200' 
                   : 'bg-black border border-white text-white hover:bg-white hover:text-black'
               }`}
             >
               {isEditing ? <><Save size={16} /> Save</> : <><Edit2 size={16} /> Edit</>}
             </button>
          )}

          {isGuest && (
            <div className="w-full space-y-3">
              <button 
                onClick={onLoginRequest}
                className="w-full py-3 bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <LogIn size={16} /> Log In
              </button>
              <button 
                onClick={onLoginRequest}
                className="w-full py-3 bg-black border border-white text-white hover:bg-white hover:text-black font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={16} /> Create Account
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Details Forms */}
        {isGuest ? (
          <div className="md:col-span-2 flex flex-col items-center justify-center border border-white/20 bg-black p-12 text-center h-full">
             <div className="bg-white/5 p-6 rounded-full mb-6 border border-white/10">
                <Shield size={48} className="text-gray-500" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Guest Mode Active</h3>
             <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
               You are using Medicrew as a guest. 
               <br/>Log in to access persistent history and personalization.
             </p>
          </div>
        ) : (
          <div className="md:col-span-2 space-y-6">
            
            {/* Personal Information */}
            <section className="bg-black border border-white/20 p-6">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                 <User size={14} /> Personal Information
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="text-xs font-bold text-gray-500 block mb-1.5 uppercase">Full Name</label>
                     <input 
                        type="text" 
                        disabled={!isEditing}
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-black border border-white/30 p-2 text-white disabled:border-transparent disabled:px-0 focus:border-white outline-none transition-all"
                     />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-500 block mb-1.5 uppercase">Email <Lock size={10} className="inline ml-1 opacity-50" /></label>
                     <input 
                        type="email" 
                        disabled={true} 
                        value={formData.email || ''}
                        className="w-full bg-transparent border-transparent p-0 text-gray-400 cursor-not-allowed"
                     />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-gray-500 block mb-1.5 uppercase">Phone</label>
                     <input 
                        type="tel" 
                        disabled={!isEditing}
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder={isEditing ? "Add phone" : "Not provided"}
                        className="w-full bg-black border border-white/30 p-2 text-white disabled:border-transparent disabled:px-0 focus:border-white outline-none transition-all"
                     />
                  </div>
                  {formData.type === 'patient' && (
                     <>
                        <div>
                           <label className="text-xs font-bold text-gray-500 block mb-1.5 uppercase">Date of Birth</label>
                           <input 
                              type="date" 
                              disabled={!isEditing}
                              value={formData.dob || ''}
                              onChange={(e) => setFormData({...formData, dob: e.target.value})}
                              className="w-full bg-black border border-white/30 p-2 text-white disabled:border-transparent disabled:px-0 focus:border-white outline-none transition-all"
                           />
                        </div>
                        <div className="md:col-span-2">
                           <label className="text-xs font-bold text-gray-500 block mb-1.5 uppercase">Known Allergies</label>
                           <input 
                              type="text" 
                              disabled={!isEditing}
                              value={formData.allergies?.join(', ') || ''}
                              onChange={(e) => setFormData({...formData, allergies: e.target.value.split(',').map(s => s.trim())})}
                              placeholder={isEditing ? "Peanuts, Penicillin..." : "None listed"}
                              className="w-full bg-black border border-white/30 p-2 text-white disabled:border-transparent disabled:px-0 focus:border-white outline-none transition-all"
                           />
                        </div>
                     </>
                  )}
               </div>
            </section>

            {/* Professional Information (Doctor Only) */}
            {formData.type === 'doctor' && (
               <section className="bg-black border border-white/20 p-6">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                    <FileText size={14} /> Medical Credentials
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label className="text-xs font-bold text-gray-500 block mb-1.5 uppercase">License Number <Lock size={10} className="inline ml-1 opacity-50" /></label>
                       <input 
                          type="text" 
                          disabled={true} 
                          value={formData.licenseNumber || ''}
                          className="w-full bg-transparent border-transparent p-0 text-gray-400 cursor-not-allowed"
                       />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-gray-500 block mb-1.5 uppercase">License Document</label>
                       {isEditing ? (
                          <div onClick={() => licenseInputRef.current?.click()} className="flex items-center gap-2 cursor-pointer text-white hover:text-gray-300">
                             <Upload size={14} /> <span className="text-xs underline">{formData.licenseFileId ? 'Re-upload' : 'Upload File'}</span>
                          </div>
                       ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                             <FileText size={14} /> <span className="text-xs">{formData.licenseFileId ? 'Uploaded' : 'Missing'}</span>
                          </div>
                       )}
                       <input type="file" ref={licenseInputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={handleLicenseUpload} />
                    </div>
                    <div className="md:col-span-2">
                       <label className="text-xs font-bold text-gray-500 block mb-1.5 uppercase">Specializations</label>
                       <input 
                          type="text" 
                          disabled={!isEditing}
                          value={formData.specializations?.join(', ') || ''}
                          onChange={(e) => setFormData({...formData, specializations: e.target.value.split(',').map(s => s.trim())})}
                          className="w-full bg-black border border-white/30 p-2 text-white disabled:border-transparent disabled:px-0 focus:border-white outline-none transition-all"
                       />
                    </div>
                    <div className="md:col-span-2">
                       <label className="text-xs font-bold text-gray-500 block mb-1.5 uppercase">Clinic / Workplace</label>
                       <input 
                          type="text" 
                          disabled={!isEditing}
                          value={formData.clinicInfo || ''}
                          onChange={(e) => setFormData({...formData, clinicInfo: e.target.value})}
                          className="w-full bg-black border border-white/30 p-2 text-white disabled:border-transparent disabled:px-0 focus:border-white outline-none transition-all"
                       />
                    </div>
                 </div>
               </section>
            )}

            {/* Privacy & Consent */}
            <section className="bg-black border border-white/20 p-6">
               <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/10 pb-2">
                  <Shield size={14} /> Privacy & Consent
               </h3>
               <div className="space-y-3">
                  <div 
                     onClick={() => toggleConsent('storeHistory')}
                     className={`flex items-center justify-between p-4 border ${isEditing ? 'cursor-pointer border-white/30 hover:bg-white/5' : 'border-transparent'}`}
                  >
                     <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 flex items-center justify-center border ${formData.consents?.storeHistory ? 'bg-white border-white' : 'border-gray-500'}`}>
                           {formData.consents?.storeHistory && <CheckCircle size={14} className="text-black" />}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-white uppercase">Store Search History</p>
                           <p className="text-xs text-gray-500">Allow saving past cases for review</p>
                        </div>
                     </div>
                  </div>

                  <div 
                     onClick={() => toggleConsent('storeImages')}
                     className={`flex items-center justify-between p-4 border ${isEditing ? 'cursor-pointer border-white/30 hover:bg-white/5' : 'border-transparent'}`}
                  >
                     <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 flex items-center justify-center border ${formData.consents?.storeImages ? 'bg-white border-white' : 'border-gray-500'}`}>
                           {formData.consents?.storeImages && <CheckCircle size={14} className="text-black" />}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-white uppercase">Store Uploaded Images</p>
                           <p className="text-xs text-gray-500">Allow analysis improvement</p>
                        </div>
                     </div>
                  </div>
               </div>
            </section>

            <div className="text-xs text-gray-600 pt-4 border-t border-white/10 flex justify-between px-2 font-mono">
               <span>ID: {formData.id}</span>
               <span>Joined: {formData.joinedDate || 'Unknown'}</span>
            </div>

            {/* Logout Section */}
            {!isGuest && (
              <div className="pt-8 mt-8">
                <button 
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full py-4 border border-white bg-black text-white hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-sm"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-black border border-white p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
               <LogOut size={32} className="text-black" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Confirm Logout</h3>
            <p className="text-gray-400 mb-8 text-sm font-mono">End your session?</p>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="py-3 border border-white text-white hover:bg-white hover:text-black font-bold text-sm uppercase"
              >
                Cancel
              </button>
              <button 
                onClick={onLogout}
                className="py-3 bg-white text-black hover:bg-gray-300 font-bold text-sm uppercase"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};