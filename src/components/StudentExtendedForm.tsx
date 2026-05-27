import React from 'react';
import { Edit2, Save } from 'lucide-react';
import { Student, StudentExtendedDetails } from '../../types';

interface Props {
  student: Student;
  onUpdate: (updatedStudent: Student) => void;
}

const StudentExtendedForm: React.FC<Props> = ({ student, onUpdate }) => {
  const [tempDetails, setTempDetails] = React.useState<StudentExtendedDetails>(student.extendedDetails || {});

  React.useEffect(() => {
    setTempDetails(student.extendedDetails || {});
  }, [student.extendedDetails]);

  const [editingSections, setEditingSections] = React.useState<Record<string, boolean>>({});
  const [dirtySections, setDirtySections] = React.useState<Record<string, boolean>>({});

  const toggleEdit = (sectionId: string) => {
    setEditingSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleSave = (sectionId: string) => {
    onUpdate({
      ...student,
      extendedDetails: tempDetails,
    });
    setEditingSections(prev => ({ ...prev, [sectionId]: false }));
    setDirtySections(prev => ({ ...prev, [sectionId]: false }));
  };

  const handleChange = (sectionId: string, field: keyof StudentExtendedDetails, value: any) => {
    setTempDetails(prev => ({
      ...prev,
      [field]: value,
    }));
    setDirtySections(prev => ({ ...prev, [sectionId]: true }));
  };

  const renderField = (sectionId: string, label: string, field: keyof StudentExtendedDetails, type: 'text' | 'select' | 'radio' | 'date' = 'text', options?: string[]) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
      {type === 'text' && (
        <input
          type="text"
          disabled={!editingSections[sectionId]}
          value={tempDetails[field] || ''}
          onChange={(e) => handleChange(sectionId, field, e.target.value)}
          className="w-full p-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm text-sm text-white disabled:opacity-50"
        />
      )}
      {type === 'date' && (
        <input
          type="date"
          disabled={!editingSections[sectionId]}
          value={tempDetails[field] || ''}
          onChange={(e) => handleChange(sectionId, field, e.target.value)}
          className="w-full p-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm text-sm text-white disabled:opacity-50"
        />
      )}
      {type === 'select' && options && (
        <select
          disabled={!editingSections[sectionId]}
          value={tempDetails[field] || ''}
          onChange={(e) => handleChange(sectionId, field, e.target.value)}
          className="w-full p-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm text-sm text-white disabled:opacity-50"
        >
          <option value="">Select...</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )}
    </div>
  );

  const SectionHeader = ({ sectionId, title }: { sectionId: string, title: string }) => (
    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
      <h3 className="text-lg font-semibold text-slate-300">{title}</h3>
      <div className="flex gap-2">
        <button onClick={() => toggleEdit(sectionId)} className="text-slate-400 hover:text-white"><Edit2 size={16} /></button>
        {editingSections[sectionId] && dirtySections[sectionId] && (
          <button onClick={() => handleSave(sectionId)} className="text-emerald-400 hover:text-emerald-300"><Save size={16} /></button>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-800 rounded-lg shadow-md p-6 border border-slate-700 mt-6 w-full">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <h2 className="text-xl font-bold text-white">Extended Details</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Details */}
        <div className="col-span-3">
            <SectionHeader sectionId="personal" title="Personal Details" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('personal', 'Gender', 'gender', 'select', ['Male', 'Female', 'Other'])}
                {renderField('personal', 'Date of Birth (DD/MM/YYYY)', 'dob')}
                {renderField('personal', 'Nationality', 'nationality')}
            </div>
        </div>

        {/* Academic Background */}
        <div className="col-span-3">
            <SectionHeader sectionId="academic" title="Academic Background" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {renderField('academic', 'Latest School / College Name', 'latestSchoolCollegeName')}
                {renderField('academic', 'Highest Qualification', 'highestQualification')}
                {renderField('academic', 'Stream / Major', 'streamMajor')}
                {renderField('academic', 'Year of Passing', 'yearOfPassing')}
                {renderField('academic', 'Overall Percentage / CGPA', 'overallPercentageCGPA')}
                {renderField('academic', 'Any Other Qualification', 'anyOtherQualification')}
                {renderField('academic', '10th Score', 'tenthPercentageCGPA')}
                {renderField('academic', '12th Score', 'twelfthPercentageCGPA')}
            </div>
        </div>

        {/* Test Scores */}
        <div className="col-span-3">
            <SectionHeader sectionId="test" title="Test Scores" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {renderField('test', 'English Test', 'englishTest', 'select', ['IELTS', 'PTE', 'TOEFL', 'Duolingo', 'Not taken'])}
                {renderField('test', 'Overall Score', 'englishTestOverallScore')}
                {renderField('test', 'Standardized Tests', 'standardizedTests', 'select', ['GRE', 'GMAT', 'SAT', 'None'])}
                {renderField('test', 'Score & Year', 'standardizedTestScoreYear')}
                {renderField('test', 'Other Test', 'otherTest')}
                {renderField('test', 'Score and Year', 'otherTestScoreYear')}
            </div>
        </div>

        {/* Abroad Education Preferences */}
        <div className="col-span-3">
            <SectionHeader sectionId="study" title="Abroad Education Preferences" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('study', 'Preferred Intake', 'preferredIntake', 'select', ['Jan', 'May', 'Sep', 'Other'])}
                {renderField('study', 'Preferred Intake Year', 'preferredIntakeYear')}
                {renderField('study', 'Preferred Level', 'preferredLevel', 'select', ['Diploma', 'Bachelor', 'Master', 'PG Diploma', 'PhD'])}
                {renderField('study', 'Preferred Course Areas', 'preferredCourseAreas')}
                {renderField('study', 'Budget (per year, INR)', 'budget')}
                {renderField('study', 'Specific Universities', 'specificUniversities')}
            </div>
        </div>

        {/* Work and Background */}
        <div className="col-span-3">
            <SectionHeader sectionId="work" title="Work and Background" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('work', 'Total Work Experience', 'totalWorkExperience')}
                {renderField('work', 'Current/Last Job Title', 'currentLastJobTitle')}
                {renderField('work', 'Employer Name & Location', 'employerNameLocation')}
                {renderField('work', 'Brief Job Role', 'briefJobRole')}
                {renderField('work', 'Any study visa refusals?', 'visaRefusals', 'select', ['Yes', 'No'])}
                {renderField('work', 'Visa Refusal Details', 'visaRefusalDetails')}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudentExtendedForm;
