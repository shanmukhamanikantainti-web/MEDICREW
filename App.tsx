import React, { useState, useCallback } from 'react';
import { IntroAnimation } from './components/IntroAnimation';
import { AuthScreen } from './components/AuthScreen';
import { PatientMode } from './components/PatientMode';
import { DoctorMode } from './components/DoctorMode';
import { AccountPage } from './components/AccountPage';
import { AppMode, UserProfile } from './types';
import { User, Stethoscope } from 'lucide-react';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.INTRO);
  const [targetMode, setTargetMode] = useState<'PATIENT' | 'DOCTOR' | null>(null);
  const [previousMode, setPreviousMode] = useState<AppMode | null>(null); // For back navigation from Account
  const [user, setUser] = useState<UserProfile | null>(null);

  const handleIntroComplete = useCallback(() => {
    setCurrentMode(AppMode.SELECTION);
  }, []);

  const handleModeChoice = (mode: 'PATIENT' | 'DOCTOR') => {
    setTargetMode(mode);
    setCurrentMode(AppMode.AUTH);
  };

  const handleAuthComplete = (userProfile: UserProfile) => {
    // Initialize default consents if missing
    const fullProfile: UserProfile = {
      ...userProfile,
      consents: userProfile.consents || { storeHistory: true, storeImages: false, locationAccess: false },
      joinedDate: new Date().toLocaleDateString()
    };
    setUser(fullProfile);
    if (targetMode === 'PATIENT') setCurrentMode(AppMode.PATIENT);
    if (targetMode === 'DOCTOR') setCurrentMode(AppMode.DOCTOR);
  };

  const handleHomeClick = () => {
    setCurrentMode(AppMode.INTRO);
    setUser(null);
    setTargetMode(null);
  };

  const handleAccountClick = () => {
    setPreviousMode(currentMode);
    setCurrentMode(AppMode.ACCOUNT);
  };

  const handleAccountBack = () => {
    if (previousMode) {
      setCurrentMode(previousMode);
      setPreviousMode(null);
    } else {
      // Fallback
      setCurrentMode(AppMode.SELECTION);
    }
  };

  const handleLoginRequest = () => {
    // Redirect to Auth screen, preserving the current targetMode if set, or defaulting based on user type if available
    if (!targetMode && user) {
       if (user.type === 'patient') setTargetMode('PATIENT');
       else if (user.type === 'doctor') setTargetMode('DOCTOR');
       else setTargetMode('PATIENT'); // Default fallback
    }
    setCurrentMode(AppMode.AUTH);
  };

  const handleLogout = () => {
    // Clear user state and redirect to intro/selection
    setUser(null);
    setTargetMode(null);
    setPreviousMode(null);
    setCurrentMode(AppMode.INTRO); // Restart flow with Intro
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  return (
    <div className="min-h-screen relative overflow-hidden text-white bg-black font-sans selection:bg-white selection:text-black">
      {/* Background EKG Lifeline Effect - B&W */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.1]">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,500 L200,500 L250,400 L300,600 L350,500 L1000,500 L1050,400 L1100,600 L1150,500 L2000,500"
            fill="none"
            stroke="#FFFFFF" 
            strokeWidth="2"
            className="animate-pulse-slow"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {currentMode === AppMode.INTRO && (
        <IntroAnimation onComplete={handleIntroComplete} />
      )}

      {currentMode === AppMode.SELECTION && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
          <div className="mb-16 text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter mb-4">
              MEDICREW
            </h1>
            <p className="text-gray-400 text-lg md:text-xl font-medium tracking-widest max-w-lg mx-auto uppercase">
              Universal Clinical Engine
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
            <button
              onClick={() => handleModeChoice('PATIENT')}
              className="group relative overflow-hidden bg-black hover:bg-white hover:text-black border border-white transition-all duration-300 p-12 flex flex-col items-center justify-center gap-6 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              <div className="p-6 border border-white rounded-full group-hover:border-black transition-transform group-hover:scale-110">
                <User size={48} />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">I am a Patient</h2>
                <p className="text-sm opacity-70 uppercase tracking-wider">Symptom Triage & Guidance</p>
              </div>
            </button>

            <button
              onClick={() => handleModeChoice('DOCTOR')}
              className="group relative overflow-hidden bg-black hover:bg-white hover:text-black border border-white transition-all duration-300 p-12 flex flex-col items-center justify-center gap-6 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              <div className="p-6 border border-white rounded-full group-hover:border-black transition-transform group-hover:scale-110">
                <Stethoscope size={48} />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">I am a Doctor</h2>
                <p className="text-sm opacity-70 uppercase tracking-wider">Clinical Decision Support</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {currentMode === AppMode.AUTH && targetMode && (
         <AuthScreen 
            selectedMode={targetMode} 
            onComplete={handleAuthComplete}
            onBack={() => setCurrentMode(AppMode.SELECTION)} 
         />
      )}

      {currentMode === AppMode.PATIENT && (
        <PatientMode onHome={handleHomeClick} onAccount={handleAccountClick} user={user} />
      )}

      {currentMode === AppMode.DOCTOR && (
        <DoctorMode onHome={handleHomeClick} onAccount={handleAccountClick} user={user} />
      )}

      {currentMode === AppMode.ACCOUNT && (
        <AccountPage 
          user={user} 
          onUpdateUser={handleUpdateUser} 
          onBack={handleAccountBack} 
          onLoginRequest={handleLoginRequest} 
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;