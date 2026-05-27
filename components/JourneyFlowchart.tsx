import React, { useState } from 'react';
import { CheckIcon, SaveIcon, EditIcon } from './icons';
import { Student, User, JourneyStepRecord } from '../types';
import { Clock, User as UserIcon, Building2, History } from 'lucide-react';

interface JourneyStep {
  id: number;
  title: string;
  description: string;
  isLoan?: boolean;
  hasSubSteps?: boolean;
}

const studentSteps: JourneyStep[] = [
  { id: 1, title: 'Initial Consultation', description: 'First meeting with the student to discuss goals.' },
  { id: 2, title: 'Application Submitted', description: 'All required documents have been submitted.' },
  { id: 3, title: 'Offer Received', description: 'The educational institution has made an offer.' },
  { id: 4, title: 'Acceptance & Deposit', description: 'Student has accepted the offer and paid the deposit.' },
  { id: 5, title: 'Visa Application', description: 'The visa application process has been initiated.' },
  { id: 6, title: 'Visa Approved', description: 'The student\'s visa has been granted.' },
  { id: 7, title: 'Pre-departure Briefing', description: 'Final orientation before the student travels.' },
];

const loanSteps: JourneyStep[] = [
  { id: 101, title: 'Initial Consultation', description: 'First meeting with the student to discuss goals.', isLoan: true },
  { id: 102, title: 'Documents Received', description: 'All required documents for loan processing have been collected.', isLoan: true, hasSubSteps: true },
  { id: 112, title: 'Application Punched', description: 'Loan application has been entered into the system.', isLoan: true },
  { id: 103, title: 'Loan Decision', description: 'Final decision from the financial institution.', isLoan: true, hasSubSteps: true },
  { id: 104, title: 'Processing Fee', description: 'Payment of the loan processing fee.', isLoan: true },
  { id: 105, title: 'Loan Disbursed', description: 'Initial disbursement of the loan amount.', isLoan: true },
  { id: 106, title: 'Trench 2', description: 'Second installment of the loan.', isLoan: true },
  { id: 107, title: 'Trench 3', description: 'Third installment of the loan.', isLoan: true },
  { id: 108, title: 'Trench 4', description: 'Fourth installment of the loan.', isLoan: true },
  { id: 109, title: 'Trench 5', description: 'Fifth installment of the loan.', isLoan: true },
  { id: 110, title: 'Trench 6', description: 'Sixth installment of the loan.', isLoan: true },
  { id: 111, title: 'Loan Closed', description: 'The loan account has been fully settled and closed.', isLoan: true },
];

interface JourneyFlowchartProps {
  student: Student;
  onUpdateStudent: (updatedStudent: Student) => void;
  currentUser?: User | null;
}

export const JourneyFlowchart: React.FC<JourneyFlowchartProps> = ({ student, onUpdateStudent, currentUser }) => {
  const isAdmin = currentUser?.role === 'admin';
  const records = student.journeyRecords || [];
  
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [tempComment, setTempComment] = useState('');

  const calculateTotalDays = (type: 'student' | 'loan') => {
    const consultationStepId = type === 'student' ? 1 : 101;
    const consultationRecords = records.filter(r => r.stepId === consultationStepId && r.type === type);
    if (consultationRecords.length === 0) return 0;
    
    const myConsultation = consultationRecords.find(r => r.userId === currentUser?.id);
    const referenceRecord = isAdmin ? consultationRecords.reduce((earliest, current) => 
      new Date(current.timestamp) < new Date(earliest.timestamp) ? current : earliest
    , consultationRecords[0]) : myConsultation;

    if (!referenceRecord) return 0;

    const start = new Date(referenceRecord.timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const toggleStep = (stepId: number, type: 'student' | 'loan', subStep?: string, comment?: string) => {
    if (!currentUser) return;

    let newRecords = [...records];
    
    // For checkboxes (no subStep and not decision steps), we toggle
    if (!subStep && stepId !== 103 && stepId !== 102) {
        const existingIndex = newRecords.findIndex(r => 
            r.stepId === stepId && 
            r.userId === currentUser.id && 
            r.type === type
        );
        if (existingIndex > -1) {
            newRecords.splice(existingIndex, 1);
        } else {
            newRecords.push({
                stepId,
                userId: currentUser.id,
                userName: currentUser.fullName,
                timestamp: new Date().toISOString(),
                organisationName: currentUser.organisationName || 'SilverCorp EdTech',
                type,
                comment
            });
        }
    } else {
        // For sub-steps or steps with comments, we add a new record to keep history
        // but we might want to "update" the current one if it's the same substep?
        // Actually, the user wants "history of change below", so we should keep all.
        
        newRecords.push({
            stepId,
            userId: currentUser.id,
            userName: currentUser.fullName,
            timestamp: new Date().toISOString(),
            organisationName: currentUser.organisationName || 'SilverCorp EdTech',
            type,
            subStep,
            comment
        });
    }

    onUpdateStudent({
      ...student,
      journeyRecords: newRecords
    });
    setEditingCommentId(null);
  };

  const renderStep = (step: JourneyStep, type: 'student' | 'loan') => {
    const allStepRecords = records.filter(r => r.stepId === step.id && r.type === type);
    
    // Find latest record for current user
    const myRecords = allStepRecords.filter(r => r.userId === currentUser?.id);
    const myLatestRecord = myRecords.length > 0 ? myRecords[myRecords.length - 1] : null;
    const isCompletedByMe = !!myLatestRecord;
    const mySubStep = myLatestRecord?.subStep;

    // Visibility logic for admin/employee
    const visibleRecords = isAdmin ? allStepRecords : myRecords;

    return (
      <div key={step.id} className="relative mb-8 last:mb-0">
        <div className="absolute -left-4 top-1 z-10">
          {!step.hasSubSteps ? (
            <button
              onClick={() => toggleStep(step.id, type)}
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                isCompletedByMe ? 'bg-green-500 border-green-500 text-white' : 'bg-slate-900 border-slate-700 text-transparent hover:border-green-500'
              }`}
            >
              <CheckIcon className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
               <div className="w-2 h-2 rounded-full bg-slate-500" />
            </div>
          )}
        </div>
        <div className="ml-10">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white leading-tight">{step.title}</h3>
            {isCompletedByMe && !step.hasSubSteps && (
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(myLatestRecord.timestamp).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">{step.description}</p>
          
          {/* Sub-steps for Documents Received (102) */}
          {step.id === 102 && (
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => toggleStep(step.id, type, 'Partial')}
                className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all uppercase tracking-wider ${
                  mySubStep === 'Partial' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-amber-500'
                }`}
              >
                Partial
              </button>
              <button
                onClick={() => toggleStep(step.id, type, 'Complete')}
                className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all uppercase tracking-wider ${
                  mySubStep === 'Complete' ? 'bg-green-500 border-green-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-green-500'
                }`}
              >
                Complete
              </button>
              {mySubStep && (
                <span className="text-[10px] text-slate-500 font-mono self-center ml-auto">
                  {new Date(myLatestRecord.timestamp).toLocaleDateString('en-GB')}
                </span>
              )}
            </div>
          )}

          {/* Sub-steps for Loan Decision (103) */}
          {step.id === 103 && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={() => toggleStep(step.id, type, 'Approved')}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all uppercase tracking-wider ${
                    mySubStep === 'Approved' ? 'bg-green-500 border-green-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-green-500'
                  }`}
                >
                  Loan Approved
                </button>
                <button
                  onClick={() => toggleStep(step.id, type, 'Rejected')}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-all uppercase tracking-wider ${
                    mySubStep === 'Rejected' ? 'bg-red-500 border-red-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-red-500'
                  }`}
                >
                  Loan Rejected
                </button>
                {mySubStep && (
                  <span className="text-[10px] text-slate-500 font-mono self-center ml-auto">
                    {new Date(myLatestRecord.timestamp).toLocaleDateString('en-GB')}
                  </span>
                )}
              </div>
              
              {mySubStep && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 group">
                    <input
                      type="text"
                      required
                      readOnly={editingCommentId !== `${step.id}-${mySubStep}`}
                      placeholder={mySubStep === 'Approved' ? "add loan amount" : "type rejection reason"}
                      value={editingCommentId === `${step.id}-${mySubStep}` ? tempComment : (myLatestRecord?.comment || '')}
                      onChange={(e) => setTempComment(e.target.value)}
                      className={`flex-1 bg-transparent border-b border-slate-700 text-xs py-1 px-0 text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-600 transition-colors ${editingCommentId !== `${step.id}-${mySubStep}` ? 'cursor-default' : ''}`}
                    />
                    {editingCommentId === `${step.id}-${mySubStep}` ? (
                      <button 
                        onClick={() => toggleStep(step.id, type, mySubStep, tempComment)}
                        className="p-1 text-green-400 hover:text-green-300 transition-colors"
                        title="Save"
                      >
                        <SaveIcon className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setEditingCommentId(`${step.id}-${mySubStep}`);
                          setTempComment(myLatestRecord?.comment || '');
                        }}
                        className="p-1 text-slate-500 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {!myLatestRecord?.comment && editingCommentId !== `${step.id}-${mySubStep}` && (
                    <p className="text-[9px] text-red-400 mt-1 italic">* This field is mandatory (Click edit to add)</p>
                  )}
                </div>
              )}

              {/* History of changes for current user (or admin) */}
              {visibleRecords.filter(r => r.subStep === mySubStep && r.comment).length > 1 && (
                <div className="mt-2 pl-2 border-l border-slate-700 space-y-1">
                  <div className="flex items-center gap-1 text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                    <History className="w-3 h-3" />
                    History of change
                  </div>
                  {visibleRecords.filter(r => r.subStep === mySubStep && r.comment).slice(0, -1).reverse().map((record, idx) => (
                    <div key={idx} className="text-[10px] text-slate-500 italic">
                      "{record.comment}" - {new Date(record.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admin view of all interactions */}
          {isAdmin && allStepRecords.length > 0 && (
            <div className="mt-3 space-y-2">
              {allStepRecords.map((record, idx) => (
                <div key={idx} className="bg-slate-900/50 rounded p-2 border border-slate-700/50 text-[10px] animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="flex items-center justify-between text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="w-3 h-3 text-blue-400" />
                      <span className="font-semibold">{record.userName}</span>
                      {record.subStep && (
                        <span className={`ml-1 px-1.5 py-0.5 rounded-sm font-bold uppercase text-[8px] ${
                          record.subStep === 'Approved' || record.subStep === 'Complete' ? 'bg-green-900/40 text-green-400 border border-green-500/20' : 
                          record.subStep === 'Rejected' ? 'bg-red-900/40 text-red-400 border border-red-500/20' :
                          'bg-amber-900/40 text-amber-400 border border-amber-500/20'
                        }`}>
                          {record.subStep}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(record.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                  {record.comment && (
                    <div className="mt-1.5 px-2 py-1 bg-slate-800/50 rounded border-l-2 border-blue-500/50 text-slate-300 italic">
                      {record.comment}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-1 text-slate-500 italic">
                    <Building2 className="w-3 h-3" />
                    {record.organisationName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Student Journey Flowchart */}
      <div className="bg-slate-800 rounded-xl shadow-xl p-6 border border-slate-700/50 h-full relative">
        <div className="absolute top-6 right-6 flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total Days</span>
          <span className="text-2xl font-black text-blue-400 leading-none">{calculateTotalDays('student')}</span>
        </div>
        <div className="flex items-center gap-3 border-b border-slate-700 pb-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Student Journey Flowchart</h2>
        </div>
        <div className="relative pl-8 mt-4">
          <div className="absolute left-8 top-4 h-[calc(100%-2rem)] w-0.5 bg-gradient-to-b from-slate-700 via-slate-700 to-transparent" />
          {studentSteps.map(step => renderStep(step, 'student'))}
        </div>
      </div>

      {/* Education Loan Journey Flowchart */}
      <div className="bg-slate-800 rounded-xl shadow-xl p-6 border border-slate-700/50 h-full relative">
        <div className="absolute top-6 right-6 flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total Days</span>
          <span className="text-2xl font-black text-emerald-400 leading-none">{calculateTotalDays('loan')}</span>
        </div>
        <div className="flex items-center gap-3 border-b border-slate-700 pb-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Education Loan Journey Flowchart</h2>
        </div>
        <div className="relative pl-8 mt-4">
          <div className="absolute left-8 top-4 h-[calc(100%-2rem)] w-0.5 bg-gradient-to-b from-slate-700 via-slate-700 to-transparent" />
          {loanSteps.map(step => renderStep(step, 'loan'))}
        </div>
      </div>
    </div>
  );
};

