export type ServiceCategory = 'Document Editing' | 'Abroad Education' | 'Domestic Education' | 'Visa Support' | 'Test Prep' | 'Profile Building' | 'Education Loan' | 'Other';
export type LeadStatus = 'New' | 'In Follow-up' | 'Converted' | 'Lost' | 'Finalised';
export type FollowUpFilter = 'all' | 'overdue' | 'today' | 'in_a_week' | 'not_required';

export enum TaskStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
  Canceled = 'Canceled',
}

export interface ChatMessage {
  id: number;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  isFlagged?: boolean;
  userName?: string;
}

export interface EmergencyContact {
  name: string;
  email: string;
  phone: string;
  relation: string;
}

export interface Credential {
  id: string;
  link: string;
  userId: string;
  pass: string;
  remark: string;
  additionalRemark: string;
}

export interface AppDocument {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  uploadedBy?: string;
  uploadedAt?: Date;
}

export interface Note {
  id: number;
  author: string;
  authorInitials: string;
  avatarBgColor: string;
  avatarTextColor: string;
  timestamp: string;
  text: string;
}

export interface Task {
  id: string;
  description: string;
  dueDate: Date;
  status: TaskStatus;
  assignedTo: string;
  assignedBy: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
}

export interface UserTask {
  id: string;
  text: string;
  completed: boolean;
  date: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  studentId?: string;
  collaboratorId?: string;
}

export interface HistoryEntry {
  id: string;
  type: 'status' | 'countries' | 'note' | 'date' | 'service' | 'general';
  user: string;
  timestamp: string;
  description: string;
}

export interface StudentExtendedDetails {
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  nationality?: string;
  maritalStatus?: 'Single' | 'Married' | 'Other';
  mobile?: string;
  alternatePhone?: string;
  email?: string;
  currentCityState?: string;
  preferredContactMethod?: 'Call' | 'WhatsApp' | 'Email';
  highestQualification?: string;
  streamMajor?: string;
  yearOfPassing?: string;
  overallPercentageCGPA?: string;
  tenthPercentageCGPA?: string;
  twelfthPercentageCGPA?: string;
  lastCollegeSchool?: string;
  englishTest?: 'IELTS' | 'PTE' | 'TOEFL' | 'Duolingo' | 'Not taken';
  englishTestOverallScore?: string;
  englishTestListening?: string;
  englishTestReading?: string;
  englishTestWriting?: string;
  englishTestSpeaking?: string;
  standardizedTests?: 'GRE' | 'GMAT' | 'SAT' | 'None';
  standardizedTestScoreYear?: string;
  otherTest?: string;
  otherTestScoreYear?: string;
  preferredIntake?: 'Jan' | 'May' | 'Sep' | 'Other';
  preferredIntakeOther?: string;
  preferredIntakeYear?: string;
  preferredLevel?: 'Diploma' | 'Bachelor' | 'Master' | 'PG Diploma' | 'PhD';
  preferredCountriesList?: string;
  preferredCourseAreas?: string;
  budget?: string;
  specificUniversities?: string;
  totalWorkExperience?: string;
  currentLastJobTitle?: string;
  employerNameLocation?: string;
  briefJobRole?: string;
  visaRefusals?: 'Yes' | 'No';
  visaRefusalDetails?: string;
  latestSchoolCollegeName?: string;
  anyOtherQualification?: string;
  prospect?: 'Hot' | 'Warm' | 'Cold';
  passport?: 'Yes' | 'No' | 'Applied' | 'Not Required';
  expectedConversion?: string;
}

export interface CollaboratorEntry {
  userId: string;
  status: 'Not Started Yet' | 'In Progress' | 'Completed' | 'Canceled';
}

export interface JourneyStepRecord {
  stepId: number;
  userId: string;
  userName: string;
  timestamp: string;
  organisationName?: string;
  type: 'student' | 'loan';
  subStep?: string;
  comment?: string;
}

export interface Student {
  id: number;
  studentId: string;
  fullName: string;
  email: string;
  mobile: string;
  preferredCountries: string[];
  avatarUrl: string;
  notes: string;
  leadStatus: LeadStatus;
  serviceCategory: ServiceCategory;
  followUpDate?: string;
  createdDate: string;
  lastModifiedDate: string;
  chatHistory: ChatMessage[];
  // New fields for detailed view
  emergencyContact: EmergencyContact;
  credentials: Credential[];
  documents: AppDocument[];
  tasks: Task[];
  detailedNotes: Note[];
  history: HistoryEntry[];
  extendedDetails?: StudentExtendedDetails;
  completedJourneySteps: number[]; // Keep for backward compatibility if needed, but we'll use the new one
  journeyRecords?: JourneyStepRecord[];
  assignedUserId?: string;
  collaborators?: CollaboratorEntry[];
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  mobile: string;
  homeAddress: string;
  emergencyContact: string;
  avatarUrl: string;
  role?: 'admin' | 'employee' | 'channel_partner' | string;
  roleCategory?: string;
  organisationName?: string;
}
