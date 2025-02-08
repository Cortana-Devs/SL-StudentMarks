import { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Student } from '../../types';
import StudentList from './StudentList';
import MarkEntry from './MarkEntry';
import SubjectManagement from './SubjectManagement';
import GenerateReport from './GenerateReport';
import { GRADES } from '../../constants/subjects';

type TabType = 'marks' | 'subjects';

const TeacherDashboard = () => {
    const [selectedGrade, setSelectedGrade] = useState<number>(1);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('marks');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'marks':
                return (
                    <div className="space-y-4 md:space-y-6">
                        {/* Report Generation */}
                        <div className="w-full">
                            <GenerateReport grade={selectedGrade} />
                        </div>
                        
                        {/* Student Management */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                            {/* Student List */}
                            <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto">
                                <StudentList
                                    grade={selectedGrade}
                                    onSelectStudent={setSelectedStudent}
                                    selectedStudent={selectedStudent}
                                />
                            </div>

                            {/* Mark Entry Form */}
                            {selectedStudent && (
                                <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
                                    <MarkEntry
                                        student={selectedStudent}
                                        grade={selectedGrade}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'subjects':
                return (
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
                        <SubjectManagement grade={selectedGrade} />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <DashboardLayout title="Teacher Dashboard">
            <div className="space-y-4 md:space-y-6 px-4 sm:px-6 lg:px-8 py-4 md:py-6">
                {/* Grade Selection */}
                <div className="bg-white shadow-lg rounded-lg p-4 md:p-6 border border-gray-100">
                    <div className="max-w-xs">
                        <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                            Select Grade
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <select
                                id="grade"
                                value={selectedGrade}
                                onChange={(e) => {
                                    setSelectedGrade(Number(e.target.value));
                                    setSelectedStudent(null);
                                }}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md transition-colors duration-200"
                            >
                                {GRADES.map((grade) => (
                                    <option key={grade} value={grade}>
                                        Grade {grade}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('marks')}
                            className={`${
                                activeTab === 'marks'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                        >
                            Student Marks
                        </button>
                        <button
                            onClick={() => setActiveTab('subjects')}
                            className={`${
                                activeTab === 'subjects'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-3 md:py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                        >
                            Manage Subjects
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                {renderTabContent()}
            </div>
        </DashboardLayout>
    );
};

export default TeacherDashboard; 