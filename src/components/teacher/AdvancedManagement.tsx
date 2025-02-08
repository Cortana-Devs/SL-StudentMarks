import { useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { toast } from 'react-hot-toast';
import { database } from '../../firebase';
import { ref, get } from 'firebase/database';

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

    const experimentalFeatures = [
        {
            title: 'Database Statistics',
            description: 'View real-time statistics of the database',
            action: fetchDatabaseStats,
            buttonText: 'Load Statistics'
        },
        {
            title: 'Performance Analytics',
            description: 'Advanced analytics and predictions (Coming Soon)',
            action: () => toast('This feature is coming soon!', { icon: '🔬' }),
            buttonText: 'Try Analytics',
            disabled: true
        },
        {
            title: 'Data Export',
            description: 'Export all data in various formats (Coming Soon)',
            action: () => toast('This feature is coming soon!', { icon: '📊' }),
            buttonText: 'Export Data',
            disabled: true
        },
        {
            title: 'Batch Operations',
            description: 'Perform operations on multiple records (Coming Soon)',
            action: () => toast('This feature is coming soon!', { icon: '⚡' }),
            buttonText: 'Batch Tools',
            disabled: true
        }
    ];

    return (
        <DashboardLayout title="Advanced Management">
            <div className="space-y-6">
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
                            <button
                                onClick={feature.action}
                                disabled={feature.disabled || loading}
                                className={`mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                                    ${feature.disabled 
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                    } transition-colors duration-200`}
                            >
                                {loading ? 'Loading...' : feature.buttonText}
                            </button>
                        </div>
                    ))}
                </div>

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