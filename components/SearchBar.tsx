import React, { useState, useEffect, useRef } from 'react';
import { LeadStatus, FollowUpFilter, ServiceCategory, User } from '../types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  
  selectedCountries: string[];
  onCountriesChange: (countries: string[]) => void;
  allCountries: string[];
  
  leadStatusFilter: LeadStatus | '';
  onLeadStatusChange: (status: LeadStatus | '') => void;
  allLeadStatuses: LeadStatus[];
  
  serviceCategoryFilter: ServiceCategory | '';
  onServiceCategoryChange: (category: ServiceCategory | '') => void;
  allServiceCategories: ServiceCategory[];

  followUpFilter: FollowUpFilter;
  onFollowUpChange: (filter: FollowUpFilter) => void;

  assignedUserFilter: string;
  onAssignedUserChange: (userId: string) => void;
  employees: User[];
  currentUserRole?: string;
}

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const MultiSelectCountry: React.FC<{
    selectedCountries: string[],
    onCountriesChange: (countries: string[]) => void,
    allCountries: string[]
}> = ({ selectedCountries, onCountriesChange, allCountries }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (country: string) => {
        const newSelection = selectedCountries.includes(country)
            ? selectedCountries.filter(c => c !== country)
            : [...selectedCountries, country];
        onCountriesChange(newSelection);
    };

    const getButtonText = () => {
        if (selectedCountries.length === 0) return "All Countries";
        if (selectedCountries.length === 1) return selectedCountries[0];
        return `${selectedCountries.length} countries selected`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left pl-3 pr-10 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
                <span className="truncate">{getButtonText()}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDownIcon />
                </span>
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-slate-900 shadow-xl border border-slate-700 rounded-md max-h-60 overflow-auto">
                    {allCountries.map(country => (
                        <label key={country} className="flex items-center space-x-2 p-2 hover:bg-slate-800 cursor-pointer">
                             <input
                                type="checkbox"
                                checked={selectedCountries.includes(country)}
                                onChange={() => handleSelect(country)}
                                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-300">{country}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};


export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery, onSearchChange,
  selectedCountries, onCountriesChange, allCountries,
  leadStatusFilter, onLeadStatusChange, allLeadStatuses,
  serviceCategoryFilter, onServiceCategoryChange, allServiceCategories,
  followUpFilter, onFollowUpChange,
  assignedUserFilter, onAssignedUserChange, employees, currentUserRole
}) => {
  const followUpOptions: { value: FollowUpFilter, label: string }[] = [
      { value: 'all', label: 'All Follow-ups' },
      { value: 'overdue', label: 'Overdue' },
      { value: 'today', label: 'Today' },
      { value: 'in_a_week', label: 'In a week' },
      { value: 'not_required', label: 'Not Required' },
  ];

  return (
    <div className="md:sticky top-16 z-40 bg-slate-800/80 backdrop-blur-sm py-2">
        <div className="py-2 px-1 sm:px-2 bg-slate-900/70 rounded-md border border-slate-700">
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3 ${
            currentUserRole === 'admin'
              ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(12rem,1.6fr)]'
              : 'lg:grid-cols-5'
          }`}
        >
            {/* Search Input */}
            <div className="relative sm:col-span-2 lg:col-span-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
            </div>
            <input
                type="text"
                placeholder="Search by name, notes, service..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-slate-500"
            />
            </div>
            {/* Follow-up Filter */}
            <div className="relative">
                <select
                    value={followUpFilter}
                    onChange={(e) => onFollowUpChange(e.target.value as FollowUpFilter)}
                    className="w-full pl-3 pr-10 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none"
                >
                    {followUpOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"><ChevronDownIcon /></span>
            </div>
            {/* Lead Status Filter */}
            <div className="relative">
                <select
                    value={leadStatusFilter}
                    onChange={(e) => onLeadStatusChange(e.target.value as LeadStatus | '')}
                    className="w-full pl-3 pr-10 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none"
                >
                    <option value="">All Lead Status</option>
                    {allLeadStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"><ChevronDownIcon /></span>
            </div>
            {/* Service Category Filter */}
            <div className="relative">
                <select
                    value={serviceCategoryFilter}
                    onChange={(e) => onServiceCategoryChange(e.target.value as ServiceCategory | '')}
                    className="w-full pl-3 pr-10 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none"
                >
                    <option value="">All Services</option>
                    {allServiceCategories.map(category => <option key={category} value={category}>{category}</option>)}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"><ChevronDownIcon /></span>
            </div>
            {/* Country Filter */}
            <div className="relative">
               <MultiSelectCountry 
                selectedCountries={selectedCountries}
                onCountriesChange={onCountriesChange}
                allCountries={allCountries}
               />
            </div>

            {/* Assigned User Filter (Admin Only) */}
            {currentUserRole === 'admin' && (
                <div className="relative min-w-0">
                    <select
                        value={assignedUserFilter}
                        onChange={(e) => onAssignedUserChange(e.target.value)}
                        className="w-full min-w-0 max-w-none pl-2.5 pr-10 py-2 bg-slate-800 border border-slate-700 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none"
                    >
                        <option value="">All Users</option>
                        <option value="unassigned">Unassigned</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                    </select>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDownIcon />
                    </span>
                </div>
            )}
        </div>
        </div>
    </div>
  );
};