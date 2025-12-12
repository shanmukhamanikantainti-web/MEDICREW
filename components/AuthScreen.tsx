import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { User, Shield, Upload, Camera, ArrowRight, X, Mail, Globe, Lock, Eye, EyeOff, ChevronRight, AlertCircle, FileText } from 'lucide-react';

interface AuthScreenProps {
  selectedMode: 'PATIENT' | 'DOCTOR';
  onComplete: (user: UserProfile) => void;
  onBack: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ selectedMode, onComplete, onBack }) => {
  const [authMethod, setAuthMethod] = useState<'CHOICE' | 'EMAIL' | 'GOOGLE_SIM' | 'GOOGLE_CONSENT' | 'GOOGLE_CHOOSER' | 'GOOGLE_CONFIRM'>('CHOICE');
  const [isRegistering, setIsRegistering] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<{name: string, email: string} | null>(null);
  
  // Doctor Verification State
  const [licenseFile, setLicenseFile] = useState<{name: string, size: number} | null>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    license: '',
  });

  const handleGuest = () => {
    onComplete({
      id: `guest-${Date.now()}`,
      type: 'guest',
      name: 'Guest User',
      authProviders: [],
      emailVerified: false
    });
  };

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setProfilePic(ev.target.result as string);
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
      setLicenseFile({
        name: file.name,
        size: file.size
      });
    }
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Doctor Validation
    if (selectedMode === 'DOCTOR' && isRegistering && !licenseFile) {
      alert("Please upload your medical license document to proceed.");
      return;
    }

    // Simulate Backend API Call (POST /api/auth/login or /api/auth/register)
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      type: selectedMode === 'PATIENT' ? 'patient' : 'doctor',
      name: isRegistering ? formData.name : 'User', // In real app, name comes from backend on login
      email: formData.email,
      profilePicUrl: profilePic || undefined,
      licenseNumber: selectedMode === 'DOCTOR' ? formData.license : undefined,
      // Store dummy reference for the file
      licenseFileId: licenseFile ? `lic_${Date.now()}` : undefined,
      verificationStatus: selectedMode === 'DOCTOR' ? 'pending' : undefined,
      authProviders: ['email'],
      emailVerified: false,
      joinedDate: new Date().toLocaleDateString()
    };
    onComplete(newUser);
  };

  const handleGoogleAuthStart = () => {
    // Show Consent Dialog first
    setAuthMethod('GOOGLE_CONSENT');
  };

  const handleGoogleConsentGiven = () => {
    // Simulate Detection Delay
    setTimeout(() => {
        setAuthMethod('GOOGLE_CHOOSER');
    }, 500);
  };

  const handleGoogleConsentDenied = () => {
    // Fallback to standard flow simulation (prompt=select_account behavior)
    setAuthMethod('GOOGLE_SIM');
    startGoogleSim(1500, "user@gmail.com", "Google User");
  };

  const handleAccountSelect = (email: string, name: string) => {
    setSelectedAccount({ email, name });
    setAuthMethod('GOOGLE_CONFIRM');
  };

  const handleGoogleConfirm = () => {
    if (!selectedAccount) return;
    setAuthMethod('GOOGLE_SIM');
    startGoogleSim(1000, selectedAccount.email, selectedAccount.name);
  };

  const startGoogleSim = (delay: number, email: string, name: string) => {
    setTimeout(() => {
        // If doctor, we might prompt for license later if missing, but here assume existing user or just auth
        const newUser: UserProfile = {
            id: `google-user-${Date.now()}`,
            type: selectedMode === 'PATIENT' ? 'patient' : 'doctor',
            name: name,
            email: email,
            authProviders: ['google'],
            emailVerified: true,
            verificationStatus: selectedMode === 'DOCTOR' ? 'pending' : undefined,
            joinedDate: new Date().toLocaleDateString()
        };
        onComplete(newUser);
    }, delay);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative z-20 text-white">
      <button onClick={onBack} className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
        <X size={24} />
      </button>

      <div className="w-full max-w-md bg-black border border-white p-8 relative shadow-[0_0_15px_rgba(255,255,255,0.1)] animate-fade-in">
        
        <h2 className="text-2xl font-bold text-white mb-2 text-center uppercase tracking-widest">
          {selectedMode === 'PATIENT' ? 'Patient' : 'Clinician'} Portal
        </h2>
        <p className="text-center text-gray-400 text-sm mb-8 font-mono">Secure Access Required</p>

        {authMethod === 'CHOICE' && (
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleGoogleAuthStart}
              className="w-full py-4 bg-white text-black hover:bg-gray-200 transition-all font-bold flex items-center justify-center gap-3 shadow-glow"
            >
              <Globe size={18} /> Continue with Google
            </button>
            
            <button 
              onClick={() => setAuthMethod('EMAIL')}
              className="w-full py-4 border border-white text-white hover:bg-white hover:text-black transition-all font-bold flex items-center justify-center gap-3"
            >
              <Mail size={18} /> Sign in with Email
            </button>

            <div className="flex items-center gap-4 my-2">
               <div className="h-[1px] bg-gray-800 flex-1"></div>
               <span className="text-xs text-gray-500 font-mono uppercase">OR</span>
               <div className="h-[1px] bg-gray-800 flex-1"></div>
            </div>
            
            <button 
              onClick={handleGuest}
              className="w-full py-3 text-gray-500 hover:text-white transition-colors text-sm font-mono uppercase"
            >
              Continue as Guest (No History)
            </button>
          </div>
        )}

        {authMethod === 'GOOGLE_CONSENT' && (
           <div className="animate-fade-in text-center">
              <div className="flex justify-center mb-4 text-white">
                 <Shield size={40} />
              </div>
              <h3 className="text-base font-bold text-white mb-2 uppercase">Account Detection</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed px-4">
                 Allow Medicrew to check for Google accounts on this device?
                 <br/><br/>
                 <span className="text-xs text-gray-600">No data stored until confirmed.</span>
              </p>
              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={handleGoogleConsentDenied}
                   className="py-3 border border-white text-white hover:bg-white hover:text-black transition-colors font-bold text-sm"
                 >
                   No, thanks
                 </button>
                 <button 
                   onClick={handleGoogleConsentGiven}
                   className="py-3 bg-white text-black hover:bg-gray-200 font-bold text-sm"
                 >
                   Allow
                 </button>
              </div>
           </div>
        )}

        {authMethod === 'GOOGLE_CHOOSER' && (
           <div className="animate-fade-in">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4 border-b border-gray-800 pb-2">Choose an account</h3>
              <div className="space-y-3">
                 <button 
                   onClick={() => handleAccountSelect("alice.doe@gmail.com", "Alice Doe")}
                   className="w-full p-3 flex items-center gap-4 border border-gray-800 hover:border-white hover:bg-white/5 transition-all text-left"
                 >
                    <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-bold text-sm">A</div>
                    <div>
                       <p className="text-sm font-bold text-white">Alice Doe</p>
                       <p className="text-xs text-gray-500">alice.doe@gmail.com</p>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-gray-500" />
                 </button>

                 <button 
                   onClick={() => handleAccountSelect("dr.smith@clinic.com", "Dr. John Smith")}
                   className="w-full p-3 flex items-center gap-4 border border-gray-800 hover:border-white hover:bg-white/5 transition-all text-left"
                 >
                    <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-bold text-sm">J</div>
                    <div>
                       <p className="text-sm font-bold text-white">Dr. John Smith</p>
                       <p className="text-xs text-gray-500">dr.smith@clinic.com</p>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-gray-500" />
                 </button>

                 <button 
                   onClick={() => handleAccountSelect("new.user@example.com", "New User")}
                   className="w-full p-3 flex items-center gap-4 border border-gray-800 hover:border-white hover:bg-white/5 transition-all text-left"
                 >
                    <div className="w-10 h-10 bg-gray-800 border border-gray-600 flex items-center justify-center text-gray-400">
                       <User size={18} />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-white">Use another account</p>
                    </div>
                 </button>
              </div>
              <button 
                onClick={() => setAuthMethod('CHOICE')}
                className="mt-6 w-full py-3 text-sm text-gray-500 hover:text-white font-mono uppercase"
              >
                Cancel
              </button>
           </div>
        )}

        {authMethod === 'GOOGLE_CONFIRM' && selectedAccount && (
           <div className="animate-fade-in text-center">
              <div className="flex justify-center mb-6">
                 <div className="w-16 h-16 bg-white flex items-center justify-center text-2xl font-bold text-black border border-white">
                    {selectedAccount.name[0]}
                 </div>
              </div>
              <h3 className="text-base font-bold text-white mb-1 uppercase">Confirm Sign In</h3>
              <p className="text-lg text-white font-medium mb-1">{selectedAccount.name}</p>
              <p className="text-sm text-gray-500 mb-8">{selectedAccount.email}</p>
              
              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={() => setAuthMethod('GOOGLE_CHOOSER')}
                   className="py-3 border border-white text-white hover:bg-white hover:text-black transition-colors font-bold text-sm"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleGoogleConfirm}
                   className="py-3 bg-white text-black hover:bg-gray-200 font-bold text-sm"
                 >
                   Continue
                 </button>
              </div>
           </div>
        )}

        {authMethod === 'GOOGLE_SIM' && (
            <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
                <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-white font-medium uppercase tracking-widest">Connecting</p>
            </div>
        )}

        {authMethod === 'EMAIL' && (
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4 animate-fade-in">
             {isRegistering && (
                <div className="flex flex-col items-center mb-4 gap-2">
                    <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 border border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-white hover:bg-white/5 transition-all overflow-hidden bg-black"
                    >
                    {profilePic ? (
                        <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <Camera size={24} className="text-gray-500" />
                    )}
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-widest">Profile Photo</span>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProfileUpload} />
                </div>
             )}

             {isRegistering && (
                 <input 
                    type="text" 
                    placeholder="Full Name" 
                    required 
                    className="bg-black border border-gray-600 p-4 text-white placeholder:text-gray-600 focus:border-white outline-none transition-colors"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                 />
             )}
             
             <div className="relative">
                <input 
                    type="email" 
                    placeholder="Email Address" 
                    required 
                    className="w-full bg-black border border-gray-600 p-4 text-white placeholder:text-gray-600 focus:border-white outline-none transition-colors"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                />
                <Mail className="absolute right-4 top-4 text-gray-600" size={18} />
             </div>

             <div className="relative">
                <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Password" 
                    required 
                    className="w-full bg-black border border-gray-600 p-4 text-white placeholder:text-gray-600 focus:border-white outline-none transition-colors pr-10"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-gray-600 hover:text-white"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
             </div>

             {!isRegistering && (
                 <div className="flex justify-between items-center text-xs">
                     <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white">
                         <input type="checkbox" className="accent-white" />
                         Remember me
                     </label>
                     <button type="button" className="text-white hover:underline font-medium uppercase tracking-wide">
                         Forgot password?
                     </button>
                 </div>
             )}

             {selectedMode === 'DOCTOR' && isRegistering && (
               <div className="space-y-4 pt-4 border-t border-gray-800">
                  <p className="text-xs text-white font-bold uppercase tracking-wide">Clinician Verification</p>
                  <input 
                    type="text" 
                    placeholder="Medical License Number" 
                    required 
                    className="w-full bg-black border border-gray-600 p-4 text-white placeholder:text-gray-600 focus:border-white outline-none transition-colors"
                    value={formData.license}
                    onChange={e => setFormData({...formData, license: e.target.value})}
                  />
                  
                  <div 
                     onClick={() => licenseInputRef.current?.click()}
                     className={`flex items-center justify-between p-4 border border-dashed cursor-pointer transition-colors ${licenseFile ? 'border-white bg-white/10' : 'border-gray-600 hover:border-white hover:bg-white/5'}`}
                  >
                     <div className="flex items-center gap-3">
                        <Upload size={16} className="text-white" />
                        <span className="text-xs text-gray-300 uppercase tracking-wider">{licenseFile ? licenseFile.name : 'Upload License (PDF/JPG)'}</span>
                     </div>
                     {licenseFile && <FileText size={16} className="text-white" />}
                  </div>
                  <input 
                     type="file" 
                     ref={licenseInputRef} 
                     className="hidden" 
                     accept=".pdf,.jpg,.jpeg,.png" 
                     onChange={handleLicenseUpload} 
                  />
                  <p className="text-[10px] text-gray-600">* Mandatory for Doctor Account</p>
               </div>
             )}

             <button 
                type="submit"
                className="mt-6 w-full py-4 bg-white text-black font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
             >
                {isRegistering ? 'CREATE ACCOUNT' : 'SIGN IN'} <ArrowRight size={18} />
             </button>

             <div className="text-center mt-4">
                 <button 
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-xs text-gray-400 hover:text-white underline font-mono uppercase"
                 >
                     {isRegistering ? 'Already have an account? Sign In' : 'New to Medicrew? Create Account'}
                 </button>
             </div>
          </form>
        )}
      </div>
    </div>
  );
};