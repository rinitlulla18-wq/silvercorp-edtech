import React, { useState, useEffect, useRef, useMemo } from 'react';
import { countryPhoneCodes, CountryPhoneCode } from '../data/countryPhoneCodes';
import { ServiceCategory, User } from '../types';
import * as XLSX from 'xlsx';

interface AddLeadModalProps {
  nextStudentId: string;
  onClose: () => void;
  onSave: (newLeadData: { fullName: string; email: string; mobile: string; followUpDate: string; serviceCategory: ServiceCategory; assignedUserId?: string; }) => void;
  onSaveBatch?: (newLeadsData: { fullName: string; email: string; mobile: string; followUpDate: string; serviceCategory: ServiceCategory; assignedUserId?: string; }[]) => void;
  initialTab?: 'manual' | 'excel';
  currentUserRole?: string;
  employees: User[];
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ nextStudentId, onClose, onSave, onSaveBatch, initialTab = 'manual', currentUserRole, employees }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'excel'>(initialTab);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    followUpDate: '',
    serviceCategory: 'Abroad Education' as ServiceCategory,
    assignedUserId: '',
  });
  const [errors, setErrors] = useState({
      email: '',
      mobile: ''
  });

  const defaultCountry = countryPhoneCodes.find(c => c.code === 'IN') || countryPhoneCodes[0];
  const [selectedCountry, setSelectedCountry] = useState<CountryPhoneCode>(defaultCountry);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const serviceCategories: ServiceCategory[] = ['Document Editing', 'Abroad Education', 'Domestic Education', 'Visa Support', 'Test Prep', 'Profile Building', 'Education Loan', 'Other'];

  // Excel upload state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelServiceCategory, setExcelServiceCategory] = useState<ServiceCategory>('Abroad Education');
  const [excelError, setExcelError] = useState<string>('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isRoundRobin, setIsRoundRobin] = useState(false);
  const [excelAssignedUserId, setExcelAssignedUserId] = useState<string>('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsCountryDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = useMemo(() => {
    return countryPhoneCodes.filter(country => 
        country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        country.dial_code.includes(countrySearch)
    );
  }, [countrySearch]);

  const validate = () => {
      let isValid = true;
      const newErrors = { email: '', mobile: '' };

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address.';
          isValid = false;
      }
      
      const mobileDigits = formData.mobile.replace(/\D/g, '');
      if (formData.mobile && (mobileDigits.length < 5 || mobileDigits.length > 15)) {
          newErrors.mobile = 'Please enter a valid phone number.';
          isValid = false;
      }
      
      setErrors(newErrors);
      return isValid;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = () => {
      validate();
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({
          ...formData,
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          mobile: `${selectedCountry.dial_code} ${formData.mobile.trim()}`,
          assignedUserId: formData.assignedUserId || undefined
      });
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setExcelFile(e.target.files[0]);
          setExcelError('');
      }
  };

  const handleExcelSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!excelFile) {
          setExcelError('Please select an Excel file.');
          return;
      }

      try {
          const data = await excelFile.arrayBuffer();
          const workbook = XLSX.read(data);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

          if (jsonData.length === 0) {
              setExcelError('The Excel file is empty.');
              return;
          }

          const parsedLeads = jsonData.map((row, index) => {
              const fullName = (row['Full Name'] || row['Name'] || row['fullName'] || '').toString().trim();
              const email = (row['Email'] || row['email'] || '').toString().trim();
              let mobile = (row['Mobile'] || row['Phone'] || row['Contact Number'] || row['mobile'] || '').toString().trim();
              const followUpDate = (row['Follow-up Date'] || row['followUpDate'] || '').toString().trim();

              if (!fullName || !email || !mobile) {
                  throw new Error(`Row ${index + 1} is missing required fields (Full Name, Email, or Mobile).`);
              }

              // Default to India (+91) if only 10 digits
              mobile = mobile.replace(/\D/g, '');
              if (mobile.length === 10) {
                  mobile = `+91 ${mobile}`;
              } else if (mobile.length > 10 && !mobile.startsWith('+')) {
                  mobile = `+${mobile}`;
              } else {
                  mobile = String(row['Mobile'] || row['Phone'] || row['Contact Number'] || row['mobile']).trim();
              }

              // Handle Excel date format if it's a number
              let formattedDate = '';
              if (followUpDate) {
                  if (typeof followUpDate === 'number') {
                      const date = new Date(Math.round((followUpDate - 25569) * 86400 * 1000));
                      formattedDate = date.toISOString().split('T')[0];
                  } else {
                      const parsed = new Date(followUpDate);
                      if (!isNaN(parsed.getTime())) {
                          formattedDate = parsed.toISOString().split('T')[0];
                      }
                  }
              }

              let assignedUserId = undefined;
              if (isRoundRobin && selectedEmployeeIds.length > 0) {
                  assignedUserId = selectedEmployeeIds[index % selectedEmployeeIds.length];
              } else if (excelAssignedUserId) {
                  assignedUserId = excelAssignedUserId;
              }

              return {
                  fullName: String(fullName),
                  email: String(email),
                  mobile: mobile,
                  followUpDate: formattedDate,
                  serviceCategory: excelServiceCategory,
                  assignedUserId
              };
          });

          if (onSaveBatch) {
              onSaveBatch(parsedLeads);
          }
      } catch (err: any) {
          setExcelError(err.message || 'Error parsing Excel file. Please ensure it has the correct format.');
      }
  };

  const isFormIncomplete = !formData.fullName || !formData.email || !formData.mobile || !formData.serviceCategory;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg m-4 transform transition-all max-h-[90vh] overflow-y-auto border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
            <div>
                <h2 id="modal-title" className="text-xl font-bold text-white">Create New Lead</h2>
                {activeTab === 'manual' && (
                    <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm font-medium text-slate-400">Student ID: <span className="font-mono bg-slate-900 text-slate-200 px-2 py-0.5 rounded border border-slate-700">{nextStudentId}</span></span>
                        <span className="text-sm font-medium text-slate-400">Status: <span className="bg-blue-900 text-blue-200 px-2 py-0.5 rounded-full text-xs font-semibold border border-blue-700">New</span></span>
                    </div>
                )}
            </div>
            <button 
                onClick={onClose} 
                className="p-1 text-slate-400 hover:text-white hover:bg-red-600 rounded-md transition-all" 
                aria-label="Close modal"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="mt-6 border-b border-slate-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`${
                        activeTab === 'manual'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                    Manual Entry
                </button>
                {currentUserRole === 'admin' && (
                    <button
                        onClick={() => setActiveTab('excel')}
                        className={`${
                            activeTab === 'excel'
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Excel Upload
                    </button>
                )}
            </nav>
        </div>

        {activeTab === 'manual' ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-300">Full Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="mt-1 w-full pl-4 pr-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-1 w-full pl-4 pr-4 py-2 bg-slate-900 border text-white rounded-md focus:ring-2 focus:border-blue-500 transition ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'}`}
              required
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-slate-300">Contact Number <span className="text-red-500">*</span></label>
            <div className="flex mt-1">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCountryDropdownOpen(prev => !prev)}
                  className="inline-flex items-center px-3 py-2 border border-r-0 border-slate-700 rounded-l-md bg-slate-900 text-sm"
                  aria-haspopup="listbox"
                  aria-expanded={isCountryDropdownOpen}
                >
                  <img src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`} alt={`${selectedCountry.name} flag`} className="w-5 mr-2" />
                  <span className="font-medium text-slate-200">{selectedCountry.dial_code}</span>
                  <svg className="w-4 h-4 ml-1.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
                {isCountryDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-72 bg-slate-900 shadow-xl border border-slate-700 rounded-md max-h-60 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-slate-900">
                        <input
                            type="text"
                            placeholder="Search country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 text-white rounded-md"
                        />
                    </div>
                    <ul>
                      {filteredCountries.map(country => (
                        <li
                          key={country.code}
                          onClick={() => {
                            setSelectedCountry(country);
                            setIsCountryDropdownOpen(false);
                            setCountrySearch('');
                          }}
                          className="flex items-center px-3 py-2 text-sm hover:bg-slate-700 cursor-pointer"
                          role="option"
                        >
                          <img src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`} alt={`${country.name} flag`} className="w-5 mr-3" />
                          <span className="font-medium text-slate-200 flex-1">{country.name}</span>
                          <span className="text-slate-400">{country.dial_code}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <input
                type="tel"
                name="mobile"
                id="mobile"
                placeholder="555 123 4567"
                value={formData.mobile}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-4 pr-4 py-2 bg-slate-900 border text-white rounded-r-md focus:ring-2 focus:z-10 focus:border-blue-500 transition ${errors.mobile ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500'}`}
                required
              />
            </div>
            {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>}
          </div>
          <div>
            <label htmlFor="serviceCategory" className="block text-sm font-medium text-slate-300">Service Category <span className="text-red-500">*</span></label>
            <div className="relative mt-1">
                <select
                name="serviceCategory"
                id="serviceCategory"
                value={formData.serviceCategory}
                onChange={handleChange}
                className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none"
                required
                >
                    {serviceCategories.map(cat => <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>)}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </div>
          </div>
          <div>
            <label htmlFor="followUpDate" className="block text-sm font-medium text-slate-300">Follow-up Date</label>
            <input
              type="date"
              name="followUpDate"
              id="followUpDate"
              value={formData.followUpDate}
            min={new Date().toLocaleDateString('sv-SE')}
            onChange={handleChange}
            className="mt-1 w-full pl-4 pr-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-500 cursor-pointer [color-scheme:dark]"
          />
          </div>
          <div>
            <label htmlFor="assignedUserId" className="block text-sm font-medium text-slate-300">Assigned User</label>
            <div className="relative mt-1">
                <select
                name="assignedUserId"
                id="assignedUserId"
                value={formData.assignedUserId}
                onChange={handleChange}
                className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none"
                >
                    <option value="" className="bg-slate-900 text-slate-400">Unassigned</option>
                    {employees.map(emp => (
                        <option key={emp.id} value={emp.id} className="bg-slate-900 text-white">
                            {emp.fullName} ({emp.roleCategory || emp.role || 'Employee'})
                        </option>
                    ))}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFormIncomplete}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              Create Lead
            </button>
          </div>
        </form>
        ) : (
        <form onSubmit={handleExcelSubmit} className="mt-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Upload Excel File (.xlsx, .xls) <span className="text-red-500">*</span></label>
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-900 hover:bg-slate-800">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 mb-3 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                            </svg>
                            <p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-slate-500">Excel files only</p>
                        </div>
                        <input id="dropzone-file" type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
                    </label>
                </div>
                {excelFile && <p className="mt-2 text-sm text-slate-300">Selected file: <span className="font-medium text-white">{excelFile.name}</span></p>}
                {excelError && <p className="mt-2 text-sm text-red-500">{excelError}</p>}
            </div>

            <div className="mt-4">
                <p className="text-xs text-slate-400 mb-2">
                    <strong>Note:</strong> The Excel file should contain columns named <strong>Full Name</strong>, <strong>Email</strong>, and <strong>Mobile</strong>. Optional: <strong>Follow-up Date</strong> (YYYY-MM-DD). Mobile numbers with 10 digits will default to India (+91).
                </p>
            </div>

            <div>
                <label htmlFor="excelServiceCategory" className="block text-sm font-medium text-slate-300">Apply Service Category to all imported leads <span className="text-red-500">*</span></label>
                <div className="relative mt-1">
                    <select
                        name="excelServiceCategory"
                        id="excelServiceCategory"
                        value={excelServiceCategory}
                        onChange={(e) => setExcelServiceCategory(e.target.value as ServiceCategory)}
                        className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none"
                        required
                    >
                        {serviceCategories.map(cat => <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>)}
                    </select>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </span>
                </div>
            </div>

            <div className="space-y-3 p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Round Robin Assignment</label>
                    <button
                        type="button"
                        onClick={() => setIsRoundRobin(!isRoundRobin)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${isRoundRobin ? 'bg-blue-600' : 'bg-slate-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRoundRobin ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {isRoundRobin ? (
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-500 uppercase">Select Employees for Round Robin</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-900 rounded border border-slate-700">
                            {employees.map(emp => (
                                <label key={emp.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-800 p-1 rounded transition">
                                    <input
                                        type="checkbox"
                                        checked={selectedEmployeeIds.includes(emp.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedEmployeeIds([...selectedEmployeeIds, emp.id]);
                                            } else {
                                                setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== emp.id));
                                            }
                                        }}
                                        className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-slate-300 truncate">{emp.fullName}</span>
                                </label>
                            ))}
                        </div>
                        {selectedEmployeeIds.length === 0 && <p className="text-[10px] text-amber-400">Please select at least one employee.</p>}
                    </div>
                ) : (
                    <div>
                        <label htmlFor="excelAssignedUserId" className="block text-xs font-medium text-slate-500 uppercase mb-1">Single Assignment (Optional)</label>
                        <div className="relative">
                            <select
                                id="excelAssignedUserId"
                                value={excelAssignedUserId}
                                onChange={(e) => setExcelAssignedUserId(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-700 text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition appearance-none"
                            >
                                <option value="">Unassigned</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.fullName} ({emp.roleCategory || emp.role || 'Employee'})
                                    </option>
                                ))}
                            </select>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="pt-4 flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-sm font-medium text-slate-200 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!excelFile}
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                    Import Leads
                </button>
            </div>
        </form>
        )}
      </div>
    </div>
  );
};