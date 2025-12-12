export enum AppMode {
  INTRO = 'INTRO',
  SELECTION = 'SELECTION',
  AUTH = 'AUTH',
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ACCOUNT = 'ACCOUNT',
}

export interface UserProfile {
  id: string;
  type: 'guest' | 'patient' | 'doctor';
  name: string;
  email?: string;
  phone?: string;
  profilePicUrl?: string;
  // Patient specific
  dob?: string;
  age?: number;
  allergies?: string[];
  // Doctor specific
  licenseNumber?: string;
  licenseAuthority?: string;
  licenseFileId?: string; // New field for uploaded license reference
  specializations?: string[];
  clinicInfo?: string;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  // Common
  consents?: {
    storeHistory: boolean;
    storeImages: boolean;
    locationAccess: boolean;
  };
  joinedDate?: string;
  // Auth specific
  authProviders?: string[]; // e.g. ['email', 'google']
  emailVerified?: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  query_summary: string;
  type: 'patient' | 'doctor';
  data: PatientResponse | DoctorResponse;
}

export interface AccountViewData {
  full_name: string;
  email?: string;
  phone?: string;
  role: 'patient' | 'doctor';
  date_of_birth?: string;
  age?: number;
  allergies?: string[];
  medical_license_number?: string;
  license_authority?: string;
  license_file_id?: string;
  specializations?: string[];
  profile_pic_url?: string;
  profile_pic_thumbnail_url?: string;
  profile_pic_status?: string;
  consent_flags?: {
    store_history: boolean;
    store_images: boolean;
    location_access: boolean;
  };
  verification_status?: string;
  account_creation_date?: string;
  clinic_info?: string;
  metadata?: Record<string, any>;
  auth_providers?: string[];
  email_verified?: boolean;
  can_change_email?: boolean;
  can_logout?: boolean;
  auth_account_candidates?: Array<{ email: string; name: string; avatar_hint?: string; source: string; }>;
}

export interface GuestAccountView {
  role: "guest";
  display_name: string;
  default_profile_pic_url: string;
  can_edit: boolean;
  can_view_history: boolean;
  requires_login_message: string;
  can_logout: boolean;
}

export interface HistoryMetadata {
  can_save: boolean;
  history_id: string | null;
}

export interface DoctorListing {
  doctor_id: string;
  name: string;
  profile_pic_thumbnail_url: string;
  primary_specialty: string;
  practice_type: "hospital" | "clinic" | "telehealth";
  distance_km: number;
  estimated_travel_time?: string;
  availability_summary: string;
  verified: boolean;
  rating: number;
  review_count?: number;
  short_bio: string;
  actions: string[]; // ["call","book","directions","view_profile","teleconsult"]
  relevance_score?: number;
  live_data?: {
    status: "online" | "offline" | "busy" | "moving";
    last_ping: string;
    current_coordinates?: { lat: number; lng: number };
  };
}

export interface DoctorProfile {
  doctor_id: string;
  full_name: string;
  profile_pic_url: string;
  headline: string;
  verified_status: { status: "verified" | "unverified" | "pending"; verified_on: string | null };
  specialties: string[];
  qualifications: string[];
  languages_spoken: string[];
  practice_locations: Array<{
    location_id: string;
    clinic_name: string;
    address: string;
    geo: { lat: number; lon: number };
    phone: string;
    hours: string;
    accepts_insurance: boolean;
    teleconsult_available: boolean;
  }>;
  contact_methods: { phone: string; book_url: string; teleconsult_url: string };
  availability_detailed: string[];
  areas_of_expertise: string[];
  patient_reviews_summary?: { avg_rating: number; review_snippets: string[] };
  education_and_training: string[];
  consultation_fee: { in_person: number | null; teleconsult: number | null; currency: string };
  insurance_accepted: string[];
  emergency_recommendation?: string;
  profile_verification_badge: boolean;
  trust_provenance?: { verified_by: string; verified_docs: string };
  ui_render_hints: { highlight_with_lifeline_glow: boolean; emphasize_action_buttons: string[] };
}

// Patient JSON Schema Types
export interface PatientResponse {
  mode: "patient";
  disclaimer: string;
  session_id: string;
  timestamp: string;
  user_input_raw: string;
  parsed_summary: string;
  case_summary_for_doctor: string;
  missing_information: string[];
  symptom_entities: string[];
  triage_level: "emergency" | "urgent" | "see_soon" | "self_care" | "insufficient_info";
  red_flag_matches: string[];
  first_aid_instructions: string[];
  image_provenance: Array<{
    image_id: string;
    description: string;
    ocr_text: string;
    upload_status: "success" | "partial" | "failed";
    image_error?: string;
    retry_suggestion: string;
    timestamp: string;
  }>;
  medication_suggestions: Array<{
    name: string;
    type: "OTC";
    purpose: string;
    typical_dose: string;
    warnings: string[];
    when_to_see_doctor: string;
    derived_from: "text" | "image" | "audio";
    confidence: number;
  }>;
  specialties_to_consult: Array<{ specialty: string; reason: string }>;
  nearby_doctors_query: {
    enabled: boolean;
    query_text: string;
    filters: string[];
  };
  nearby_doctors_list?: DoctorListing[];
  real_time_tracking?: {
    is_active: boolean;
    refresh_interval_seconds: number;
    user_coordinates?: { lat: number; lng: number };
    status: string;
  };
  next_steps: string[];
  notes_for_user: string;
  can_save_history: boolean;
  history_id?: string;
  history_metadata?: HistoryMetadata;
  account_view_data?: AccountViewData;
  account_editable_fields?: string[];
  guest_account_view?: GuestAccountView;
  ui_style_snippet: any;
}

// Doctor JSON Schema Types
export interface DoctorResponse {
  mode: "doctor";
  disclaimer: string;
  session_id: string;
  timestamp: string;
  input_source: {
    type: "free_text" | "EHR" | "FHIR" | "upload" | "voice" | "mixed";
    identifier: string;
    provided_by: "clinician";
  };
  patient_summary: string;
  
  // PARSED REPORTS PIPELINE
  parsed_reports: Array<{
    file_id: string;
    file_name: string;
    report_type: "lab" | "radiology_text" | "discharge_summary" | "other" | "unknown";
    upload_timestamp: string;
    parsed_confidence: number; // 0.0 to 1.0
    parsing_error?: string;
    extracted_entities: Array<{
      category: string; // e.g. "Chemistry", "Hematology", "Vitals"
      name: string; // Normalized name e.g. "Hemoglobin"
      value: string;
      unit?: string;
      reference_range?: string;
      flag?: "high" | "low" | "critical" | "normal";
      confidence: number;
      source_snippet: string; // OCR text used
      page_number?: number;
    }>;
    summary_findings: string;
  }>;

  treatment_pattern_detected: {
    pattern_id: string;
    pattern_description: string;
    matched_order_text: string;
    template_confidence: number;
  };

  // 1. TREATMENT PROCEDURE (Step-wise)
  treatment_procedure: Array<{
    step_number: number;
    description: string;
    equipment_needed: string[];
    time_required: string;
    risks: string[];
    derived_from: string[]; 
    evidence_strength: "high" | "moderate" | "low" | "insufficient";
    confidence: number;
  }>;

  // 2. MEDICATIONS DURING TREATMENT (In-Hospital)
  medications_during_treatment: Array<{
    drug_name: string;
    indication: string;
    dosage: string;
    route: string;
    frequency: string;
    duration: string;
    adjustment_rules: string;
    contraindications: string[];
    interactions_to_consider: string[];
    monitoring_requirements: string[];
    derived_from: string[];
    confidence: number;
    evidence: Array<{
      source: string;
      publisher: string;
      date: string;
      url: string;
      excerpt: string;
    }>;
  }>;

  // 3. DISCHARGE INSTRUCTIONS
  discharge_instructions: Array<{
    instruction: string;
    reason: string;
    duration: string;
    warning_signs: string[];
    follow_up_interval: string;
    lifestyle_recommendations: string[];
    medication_adherence_notes: string;
    confidence: number;
  }>;

  // 4. POST-DISCHARGE MEDICATION PLAN
  post_discharge_medications: Array<{
    drug_name: string;
    indication: string;
    dosage: string;
    route: string;
    frequency: string;
    duration: string;
    instructions: string;
    confidence: number;
  }>;

  data_insufficiency_notes?: string;

  personalized_recommendations: Array<{
    recommendation_id: string;
    action: "KEEP" | "MODIFY" | "AVOID" | "DEFER";
    suggestion: string;
    exact_changes: string;
    clinical_rationale: string;
    patient_data_used: string[];
    required_monitoring: string[];
    timeframe: "immediate" | "within_24h" | "before_next_dose";
    evidence_strength: "high" | "moderate" | "low" | "insufficient";
    confidence: number;
    recommended_next_step?: string;
    evidence: Array<{
      source: string;
      publisher: string;
      date: string;
      url: string;
      excerpt: string;
    }>;
    provenance_files: Array<{
      file_id: string;
      snippet_quote?: string;
    }>;
  }>;
  
  alternative_options: Array<{
    option_id: string;
    option_description: string;
    rationale: string;
    evidence: any[];
  }>;
  red_flags: Array<{
    flag_id: string;
    description: string;
    urgency: "urgent" | "non-urgent";
    suggested_action: string;
  }>;
  conflicts_or_gaps: any[];
  search_log: Array<{
    timestamp: string;
    action: string;
    parameters: any;
    result_summary: string;
  }>;
  ehr_export_suggestion: {
    can_export: boolean;
    export_format: string;
    export_payload_example: any;
  };
  sources_consulted: string[];
  notes_for_clinician: string;
  can_save_history: boolean;
  history_id?: string;
  history_metadata?: HistoryMetadata;
  account_view_data?: AccountViewData;
  account_editable_fields?: string[];
  guest_account_view?: GuestAccountView;
  ui_style_snippet: any;
  agent_version: string;
}

export type AnalysisStatus = 'idle' | 'recording' | 'processing' | 'success' | 'error';