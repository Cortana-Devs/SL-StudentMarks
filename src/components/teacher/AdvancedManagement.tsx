import { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { toast } from 'react-hot-toast';
import { database, auth } from '../../firebase';
import { ref, get, set } from 'firebase/database';
import { Mark } from '../../types';
import { setupSampleData, clearSampleData } from '../../utils/setupSampleData';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';

interface DatabaseStats {
    totalUsers: number;
    totalMarks: number;
    totalSubjects: number;
    averageScore: number;
    latestUpdates: Array<{
        studentId: string;
        subjectId: string;
        score: number;
        timestamp: number;
    }>;
}

const AdvancedManagement = () => {
    const [loading, setLoading] = useState(false);
    const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
    const [healthStatus, setHealthStatus] = useState<Record<string, boolean>>({});
    const [errorLogs, setErrorLogs] = useState<string[]>([]);
    const navigate = useNavigate();

    const fetchDatabaseStats = async () => {
        try {
            setLoading(true);
            const statsRef = ref(database);
            const snapshot = await get(statsRef);
            const data = snapshot.val();
            
            // Calculate statistics
            const stats: DatabaseStats = {
                totalUsers: Object.keys(data.users || {}).length,
                totalMarks: Object.keys(data.marks || {}).length,
                totalSubjects: Object.keys(data.subjects || {}).length,
                averageScore: calculateAverageScore(data.marks || {}),
                latestUpdates: getLatestUpdates(data.marks || {})
            };
            
            setDatabaseStats(stats);
            toast.success('Statistics loaded successfully');
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    const calculateAverageScore = (marks: Record<string, { score: number }>) => {
        const scores = Object.values(marks).map(mark => mark.score);
        return scores.length > 0 
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;
    };

    const getLatestUpdates = (marks: Record<string, { timestamp: number; studentId: string; subjectId: string; score: number }>) => {
        return Object.values(marks)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);
    };

    const generateSampleMarks = (studentId: string, teacherId: string, grade: number) => {
        const marks = [];
        const now = Date.now();
        
        // Generate 3 marks per subject with different timestamps
        for (let i = 0; i < 9; i++) { // 9 subjects
            for (let j = 0; j < 3; j++) {
                const baseScore = Math.floor(Math.random() * 30) + 60; // Random score between 60 and 90
                const markId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                marks.push({
                    id: markId,
                    studentId,
                    subjectId: i.toString(),
                    grade,
                    score: baseScore + Math.floor(Math.random() * 10), // Add some variation
                    comment: getCommentForScore(baseScore),
                    teacherId,
                    timestamp: now - (j * 7 * 24 * 60 * 60 * 1000) // Spread over last 3 weeks
                });
            }
        }
        return marks;
    };

    const getCommentForScore = (score: number): string => {
        if (score >= 85) return "Excellent work! Keep it up!";
        if (score >= 75) return "Good performance. Continue improving.";
        if (score >= 65) return "Satisfactory. More practice needed.";
        return "Needs improvement. Let's work harder.";
    };

    const syncAuthUsersWithDatabase = async () => {
        try {
            setLoading(true);
            
            // Get current auth user (teacher)
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error('You must be logged in to sync users');
                return;
            }
            
            // Get existing users from database
            const usersRef = ref(database, 'users');
            const dbSnapshot = await get(usersRef);
            const existingUsers = dbSnapshot.val() || {};
            
            // Restore teacher account
            existingUsers[currentUser.uid] = {
                uid: currentUser.uid,
                email: currentUser.email,
                name: 'Main Teacher',
                role: 'teacher',
                subjects: ['Sinhala', 'English', 'Mathematics', 'Science', 'History', 'Buddhism', 'Health & Physical Education', 'Art', 'Tamil']
            };

            // Restore sample student accounts and generate their marks
            const sampleStudents = [
                // Grade 1 Students
                { email: 'kasun@school.com', name: 'Kasun Tharaka', grade: 1 },
                { email: 'amal@school.com', name: 'Amal Perera', grade: 1 },
                { email: 'nimal@school.com', name: 'Nimal Silva', grade: 1 },
                { email: 'sunil@school.com', name: 'Sunil Fernando', grade: 1 },
                { email: 'kamal@school.com', name: 'Kamal Gunawardena', grade: 1 },
                
                // Grade 5 Students
                { email: 'saman@school.com', name: 'Saman Kumara', grade: 5 },
                { email: 'ruwan@school.com', name: 'Ruwan Jayasinghe', grade: 5 },
                { email: 'chamara@school.com', name: 'Chamara Bandara', grade: 5 },
                { email: 'pradeep@school.com', name: 'Pradeep Kumara', grade: 5 },
                { email: 'nuwan@school.com', name: 'Nuwan Perera', grade: 5 },
                
                // Grade 9 Students
                { email: 'lakmal@school.com', name: 'Lakmal Dissanayake', grade: 9 },
                { email: 'thilina@school.com', name: 'Thilina Rajapakse', grade: 9 },
                { email: 'buddhika@school.com', name: 'Buddhika Silva', grade: 9 },
                { email: 'charith@school.com', name: 'Charith Asalanka', grade: 9 },
                { email: 'dasun@school.com', name: 'Dasun Shanaka', grade: 9 },
                
                // One student per other grades
                { email: 'grade2@school.com', name: 'Grade Two Student', grade: 2 },
                { email: 'grade3@school.com', name: 'Grade Three Student', grade: 3 },
                { email: 'grade4@school.com', name: 'Grade Four Student', grade: 4 },
                { email: 'grade6@school.com', name: 'Grade Six Student', grade: 6 },
                { email: 'grade7@school.com', name: 'Grade Seven Student', grade: 7 },
                { email: 'grade8@school.com', name: 'Grade Eight Student', grade: 8 }
            ];

            // Create entries for all sample students and their marks
            const allMarks: Record<string, Mark> = {};
            
            for (const student of sampleStudents) {
                try {
                    // Create a predictable password: FirstName@123
                    const password = student.name.split(' ')[0] + '@123';
                    
                    // Create auth account
                    const userCredential = await createUserWithEmailAndPassword(auth, student.email, password);
                    const studentUid = userCredential.user.uid;
                    
                    // Add to database
                    existingUsers[studentUid] = {
                        uid: studentUid,
                        email: student.email,
                        name: student.name,
                        role: 'student',
                        grade: student.grade
                    };

                    // Generate and store marks for this student
                    const studentMarks = generateSampleMarks(studentUid, currentUser.uid, student.grade);
                    studentMarks.forEach(mark => {
                        allMarks[mark.id] = mark;
                    });

                    console.log(`Created account for ${student.name} (${student.email}) with password: ${password}`);
                } catch (error) {
                    if (error instanceof Error && error.message.includes('email-already-in-use')) {
                        console.log(`Account already exists for ${student.email}`);
                    } else {
                        console.error(`Error creating account for ${student.email}:`, error);
                    }
                }
            }
            
            // Update both users and marks in the database
            await Promise.all([
                set(usersRef, existingUsers),
                set(ref(database, 'marks'), allMarks)
            ]);

            toast.success('All users and marks restored to database successfully');
            
        } catch (error) {
            console.error('Error syncing users:', error);
            toast.error('Failed to sync users');
        } finally {
            setLoading(false);
        }
    };

    const handleSetupSampleData = async () => {
        try {
            setLoading(true);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error('You must be logged in');
                return;
            }
            await setupSampleData(currentUser.uid);
            toast.success('Sample data set up successfully');
        } catch (error) {
            console.error('Error setting up sample data:', error);
            toast.error('Failed to set up sample data');
        } finally {
            setLoading(false);
        }
    };

    const handleClearSampleData = async () => {
        if (!window.confirm('Are you sure you want to clear all sample data? This cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error('You must be logged in');
                return;
            }
            await clearSampleData(currentUser.uid);
            toast.success('Sample data cleared successfully');
        } catch (error) {
            console.error('Error clearing sample data:', error);
            toast.error('Failed to clear sample data');
        } finally {
            setLoading(false);
        }
    };

    const checkSystemHealth = async () => {
        try {
            setLoading(true);
            const healthChecks: Record<string, boolean> = {};
            const logs: string[] = [];

            // Check Firebase connection
            try {
                const testRef = ref(database, 'users');
                await get(testRef);
                healthChecks['Firebase Connection'] = true;
            } catch (error) {
                healthChecks['Firebase Connection'] = false;
                logs.push(`Firebase Connection Error: ${error instanceof Error ? error.message : String(error)}`);
            }

            // Check Auth Service
            try {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    healthChecks['Authentication Service'] = true;
                } else {
                    healthChecks['Authentication Service'] = false;
                    logs.push('Auth Service Error: No user is currently logged in');
                }
            } catch (error) {
                healthChecks['Authentication Service'] = false;
                logs.push(`Auth Service Error: ${error instanceof Error ? error.message : String(error)}`);
            }

            // Check Database Access
            try {
                const testRef = ref(database, 'system_health_check');
                await set(testRef, {
                    lastCheck: Date.now(),
                    status: 'ok'
                });
                healthChecks['Database Access'] = true;
            } catch (error) {
                healthChecks['Database Access'] = false;
                logs.push(`Database Access Error: ${error instanceof Error ? error.message : String(error)}`);
            }

            setHealthStatus(healthChecks);
            setErrorLogs(logs);
            
            if (Object.values(healthChecks).every(status => status)) {
                toast.success('All systems are healthy');
            } else {
                toast.error('Some systems are experiencing issues');
            }
        } catch (error) {
            console.error('Health check error:', error);
            toast.error('Failed to complete health check');
        } finally {
            setLoading(false);
        }
    };

    const experimentalFeatures = [
        {
            title: 'Database Statistics',
            description: 'View real-time statistics of the database',
            action: fetchDatabaseStats,
            buttonText: 'Load Statistics'
        },
        {
            title: 'Sample Data Management',
            description: 'Set up or clear sample data for testing',
            action: handleSetupSampleData,
            buttonText: 'Setup Sample Data',
            secondaryAction: handleClearSampleData,
            secondaryButtonText: 'Clear Sample Data'
        },
        {
            title: 'Restore Database Users',
            description: 'Restore teacher account in the Realtime Database',
            action: syncAuthUsersWithDatabase,
            buttonText: 'Restore Users'
        },
        {
            title: 'System Health Check',
            description: 'Check system components and monitor app health',
            action: checkSystemHealth,
            buttonText: 'Run Health Check'
        },
        {
            title: 'Performance Analytics',
            description: 'Advanced analytics and predictions (Coming Soon)',
            action: () => toast('This feature is coming soon!', { icon: '🔬' }),
            buttonText: 'Try Analytics',
            disabled: true
        }
    ];

    return (
        <DashboardLayout title="Advanced Management">
            <div className="space-y-6">
                {/* Back Button */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => navigate('/teacher')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Dashboard
                    </button>
                </div>

                {/* Warning Banner */}
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                This is an experimental area for testing new features. Use with caution.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Experimental Features Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                    {experimentalFeatures.map((feature, index) => (
                        <div
                            key={index}
                            className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                            <h3 className="text-lg font-medium text-gray-900">
                                {feature.title}
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                {feature.description}
                            </p>
                            <div className="mt-4 space-y-2">
                                <button
                                    onClick={feature.action}
                                    disabled={feature.disabled || loading}
                                    className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                                        ${feature.disabled 
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                        } transition-colors duration-200`}
                                >
                                    {loading ? 'Loading...' : feature.buttonText}
                                </button>
                                {feature.secondaryAction && (
                                    <button
                                        onClick={feature.secondaryAction}
                                        disabled={loading}
                                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                    >
                                        {loading ? 'Loading...' : feature.secondaryButtonText}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Health Status Display */}
                {Object.keys(healthStatus).length > 0 && (
                    <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                System Health Status
                            </h3>
                        </div>
                        <div className="border-t border-gray-200">
                            <dl>
                                {Object.entries(healthStatus).map(([service, status], index) => (
                                    <div key={service} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}>
                                        <dt className="text-sm font-medium text-gray-500">{service}</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {status ? 'Healthy' : 'Error'}
                                            </span>
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                )}

                {/* Error Logs */}
                {errorLogs.length > 0 && (
                    <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Error Logs
                            </h3>
                        </div>
                        <div className="border-t border-gray-200">
                            <ul className="divide-y divide-gray-200">
                                {errorLogs.map((log, index) => (
                                    <li key={index} className="px-4 py-3">
                                        <p className="text-sm text-red-600">{log}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Statistics Display */}
                {databaseStats && (
                    <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Database Statistics
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Real-time overview of the system
                            </p>
                        </div>
                        <div className="border-t border-gray-200">
                            <dl>
                                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Total Users</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {databaseStats.totalUsers}
                                    </dd>
                                </div>
                                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Total Marks</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {databaseStats.totalMarks}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Total Subjects</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {databaseStats.totalSubjects}
                                    </dd>
                                </div>
                                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Average Score</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {databaseStats.averageScore}%
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdvancedManagement; 