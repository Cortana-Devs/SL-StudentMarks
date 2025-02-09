import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';
import { toast } from 'react-hot-toast';
import { ref, get, set, remove, update } from 'firebase/database';
import { database, auth } from '../../firebase';
import { createUserWithEmailAndPassword, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import { sampleStudents, generateSampleMarks } from '../../utils/setupSampleData';

interface DatabaseUser {
    uid: string;
    email: string;
    name: string;
    role: string;
    grade: number;
}

type ActionType = 'complete' | 'students' | 'marks' | 'clearMarks' | 'clearAll';

const AdvancedManagement = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [loadingActions, setLoadingActions] = useState<Record<ActionType, boolean>>({
        complete: false,
        students: false,
        marks: false,
        clearMarks: false,
        clearAll: false
    });

    const setActionLoading = (action: ActionType, isLoading: boolean) => {
        setLoadingActions(prev => ({ ...prev, [action]: isLoading }));
    };

    const handleClearAllData = async () => {
        if (!window.confirm('Are you sure you want to clear ALL data? This cannot be undone.')) return;
        
        setActionLoading('clearAll', true);
        try {
            console.log('Starting clear all data operation...');
            console.log('Clearing marks...');
            await remove(ref(database, 'marks'));
            console.log('Marks cleared successfully');
            
            console.log('Clearing users...');
            await remove(ref(database, 'users'));
            console.log('Users cleared successfully');
            
            // Restore teacher account
            if (currentUser) {
                console.log('Restoring teacher account...');
                await set(ref(database, `users/${currentUser.uid}`), {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    role: 'teacher',
                    name: 'Teacher'
                });
                console.log('Teacher account restored successfully');
            }
            toast.success('All data cleared successfully');
        } catch (error) {
            console.error('Error clearing data:', error);
            if (error instanceof Error) {
                toast.error(`Failed to clear data: ${error.message}`);
            } else {
                toast.error('Failed to clear data: Unknown error');
            }
        } finally {
            setActionLoading('clearAll', false);
        }
    };

    const handleClearMarksOnly = async () => {
        if (!window.confirm('Are you sure you want to clear all marks? This cannot be undone.')) return;
        
        setActionLoading('clearMarks', true);
        try {
            console.log('Starting clear marks operation...');
            await remove(ref(database, 'marks'));
            console.log('Marks cleared successfully');
            toast.success('All marks cleared successfully');
        } catch (error) {
            console.error('Error clearing marks:', error);
            if (error instanceof Error) {
                toast.error(`Failed to clear marks: ${error.message}`);
            } else {
                toast.error('Failed to clear marks: Unknown error');
            }
        } finally {
            setActionLoading('clearMarks', false);
        }
    };

    const handleSetupStudents = async () => {
        setActionLoading('students', true);
        try {
            console.log('Starting student setup...');
            for (const student of sampleStudents) {
                const password = student.name.split(' ')[0] + '@123';
                console.log(`Setting up student: ${student.email} (Grade ${student.grade})`);
                try {
                    // Try to sign in and delete existing account
                    try {
                        console.log(`Checking for existing account: ${student.email}`);
                        const userCred = await signInWithEmailAndPassword(auth, student.email, password);
                        await deleteUser(userCred.user);
                        console.log(`Deleted existing account: ${student.email}`);
                    } catch {
                        console.log(`No existing account found for: ${student.email}`);
                    }

                    // Create new account
                    console.log(`Creating new account for: ${student.email}`);
                    const userCredential = await createUserWithEmailAndPassword(auth, student.email, password);
                    
                    // Create properly typed user data with required grade
                    const studentGrade = Number(student.grade);
                    if (isNaN(studentGrade)) {
                        throw new Error(`Invalid grade for student ${student.email}`);
                    }
                    
                    const userRef = ref(database, `users/${userCredential.user.uid}`);
                    
                    // Set each field individually using update
                    await update(userRef, {
                        uid: userCredential.user.uid,
                        email: student.email,
                        name: student.name.split(' ')[0].toLowerCase(),
                        role: 'student',
                        grade: studentGrade
                    });
                    
                    // Double-check the grade was set
                    await update(userRef, {
                        grade: studentGrade
                    });
                    
                    // Verify the data was set
                    const snapshot = await get(userRef);
                    const savedData = snapshot.val();
                    console.log('Verified saved user data:', savedData);
                    
                    if (!savedData || savedData.grade !== studentGrade) {
                        console.error('Grade mismatch in saved data:', { expected: studentGrade, actual: savedData?.grade });
                        throw new Error('Grade was not saved correctly');
                    }
                    
                    console.log(`Successfully created account for: ${student.email} with grade ${studentGrade}`);
                    toast.success(`Created account: ${student.name} (Grade ${studentGrade})`);
                } catch (error) {
                    console.error(`Error creating account for ${student.email}:`, error);
                    if (error instanceof Error) {
                        toast.error(`Failed to create account for ${student.email}: ${error.message}`);
                    } else {
                        toast.error(`Failed to create account for ${student.email}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error setting up students:', error);
            if (error instanceof Error) {
                toast.error(`Failed to set up students: ${error.message}`);
            } else {
                toast.error('Failed to set up students: Unknown error');
            }
        } finally {
            setActionLoading('students', false);
        }
    };

    const handleGenerateMarks = async () => {
        setActionLoading('marks', true);
        try {
            console.log('Starting marks generation...');
            if (!currentUser) {
                console.error('No current user found');
                toast.error('You must be logged in to generate marks');
                return;
            }
            
            console.log('Fetching users from database...');
            const usersSnapshot = await get(ref(database, 'users'));
            if (!usersSnapshot.exists()) {
                console.log('No users found in database');
                toast.error('No students found. Please set up students first.');
                return;
            }

            const users = usersSnapshot.val() as Record<string, DatabaseUser>;
            console.log('Filtering student users...');
            const students = Object.entries(users)
                .filter(([, user]) => user.role === 'student')
                .map(([id, user]) => ({ ...user, id }));
            
            console.log(`Found ${students.length} students`);
            if (students.length === 0) {
                toast.error('No students found. Please set up students first.');
                return;
            }

            console.log('Generating marks for each student...');
            for (const student of students) {
                console.log(`Generating marks for student: ${student.email}`);
                const marks = generateSampleMarks(student.id, currentUser.uid, student.grade || 1);
                for (const mark of marks) {
                    const markId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    console.log(`Adding mark ${markId} for student ${student.email}`);
                    try {
                        const markRef = ref(database, `marks/${markId}`);
                        await set(markRef, mark);
                        console.log(`Successfully added mark ${markId}`);
                    } catch (markError) {
                        console.error(`Failed to add mark ${markId}:`, markError);
                        if (markError instanceof Error) {
                            toast.error(`Failed to add mark: ${markError.message}`);
                        }
                    }
                }
                console.log(`Completed generating marks for student: ${student.email}`);
            }
            console.log('Successfully generated marks for all students');
            toast.success('Generated marks for all students');
        } catch (error) {
            console.error('Error generating marks:', error);
            if (error instanceof Error) {
                toast.error(`Failed to generate marks: ${error.message}`);
            } else {
                toast.error('Failed to generate marks: Unknown error');
            }
        } finally {
            setActionLoading('marks', false);
        }
    };

    const handleSetupComplete = async () => {
        setActionLoading('complete', true);
        try {
            console.log('Starting complete setup process...');
            console.log('Step 1: Clearing all data...');
            await handleClearAllData();
            console.log('Step 2: Setting up students...');
            await handleSetupStudents();
            console.log('Step 3: Generating marks...');
            await handleGenerateMarks();
            console.log('Complete setup finished successfully');
            toast.success('Complete setup finished successfully');
        } catch (error) {
            console.error('Error in complete setup:', error);
            toast.error('Failed to complete setup');
        } finally {
            setActionLoading('complete', false);
        }
    };

    const actions = [
        {
            title: 'Complete Setup',
            description: 'Clear all data and set up fresh sample students with marks',
            action: handleSetupComplete,
            buttonText: 'Run Complete Setup',
            buttonColor: 'bg-green-600 hover:bg-green-700',
            loadingKey: 'complete' as ActionType
        },
        {
            title: 'Student Management',
            description: 'Set up sample student accounts only',
            action: handleSetupStudents,
            buttonText: 'Setup Students',
            buttonColor: 'bg-blue-600 hover:bg-blue-700',
            loadingKey: 'students' as ActionType
        },
        {
            title: 'Mark Management',
            description: 'Generate sample marks for existing students',
            action: handleGenerateMarks,
            buttonText: 'Generate Marks',
            buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
            loadingKey: 'marks' as ActionType
        },
        {
            title: 'Clear Marks',
            description: 'Remove all marks while keeping student accounts',
            action: handleClearMarksOnly,
            buttonText: 'Clear All Marks',
            buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
            loadingKey: 'clearMarks' as ActionType
        },
        {
            title: 'Clear Everything',
            description: 'Remove all data (students and marks)',
            action: handleClearAllData,
            buttonText: 'Clear All Data',
            buttonColor: 'bg-red-600 hover:bg-red-700',
            loadingKey: 'clearAll' as ActionType
        }
    ];

    return (
        <DashboardLayout title="Advanced Management">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/teacher')}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </button>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {actions.map((action, index) => (
                        <div
                            key={index}
                            className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
                        >
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {action.title}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {action.description}
                                </p>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={action.action}
                                        disabled={loadingActions[action.loadingKey]}
                                        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${action.buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                            loadingActions[action.loadingKey] ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        {loadingActions[action.loadingKey] ? 'Processing...' : action.buttonText}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdvancedManagement; 