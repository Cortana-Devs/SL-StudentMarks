import React, { useEffect, useState } from 'react';
import { Student, Subject, Mark } from '../../types';
import { getSubjects, getStudentMarks, addMark, updateMark } from '../../services/realtimeDatabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface MarkEntryProps {
    student: Student;
    grade: number;
}

const MarkEntry = ({ student, grade }: MarkEntryProps) => {
    const { currentUser } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [score, setScore] = useState<string>('');
    const [comment, setComment] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [existingMarks, setExistingMarks] = useState<Mark[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [fetchedSubjects, fetchedMarks] = await Promise.all([
                    getSubjects(grade),
                    getStudentMarks(student.id)
                ]);
                setSubjects(fetchedSubjects);
                setExistingMarks(fetchedMarks);
                
                // Reset form
                setSelectedSubject('');
                setScore('');
                setComment('');
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load subjects and marks');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [grade, student.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedSubject || !score || !currentUser) {
            toast.error('Please fill in all required fields');
            return;
        }

        const scoreNum = Number(score);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
            toast.error('Score must be between 0 and 100');
            return;
        }

        try {
            setSubmitting(true);
            
            const existingMark = existingMarks.find(
                mark => mark.subjectId === selectedSubject
            );

            if (existingMark) {
                await updateMark(existingMark.id, {
                    score: scoreNum,
                    comment,
                    timestamp: Date.now()
                });
                toast.success('Mark updated successfully');
            } else {
                await addMark({
                    studentId: student.id,
                    subjectId: selectedSubject,
                    grade,
                    score: scoreNum,
                    comment,
                    teacherId: currentUser.uid,
                    timestamp: Date.now()
                });
                toast.success('Mark added successfully');
            }

            // Reset form
            setSelectedSubject('');
            setScore('');
            setComment('');

            // Refresh marks
            const updatedMarks = await getStudentMarks(student.id);
            setExistingMarks(updatedMarks);
        } catch (error) {
            console.error('Error saving mark:', error);
            toast.error('Failed to save mark');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
                Enter Marks for {student.name}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <select
                            id="subject"
                            value={selectedSubject}
                            onChange={(e) => {
                                setSelectedSubject(e.target.value);
                                const existingMark = existingMarks.find(
                                    mark => mark.subjectId === e.target.value
                                );
                                if (existingMark) {
                                    setScore(existingMark.score.toString());
                                    setComment(existingMark.comment || '');
                                } else {
                                    setScore('');
                                    setComment('');
                                }
                            }}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md transition-colors duration-200"
                            required
                        >
                            <option value="">Select a subject</option>
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-1">
                        Score (0-100)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <input
                            type="number"
                            id="score"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md transition-colors duration-200"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                        Comment (Optional)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                        <textarea
                            id="comment"
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md transition-colors duration-200"
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            'Save Mark'
                        )}
                    </button>
                </div>
            </form>

            {/* Existing Marks */}
            {existingMarks.length > 0 && (
                <div className="mt-8">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Existing Marks</h4>
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Subject
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Score
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Updated
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {existingMarks.map((mark) => (
                                    <tr 
                                        key={mark.id}
                                        className="hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {subjects.find(s => s.id === mark.subjectId)?.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                mark.score >= 75 ? 'bg-green-100 text-green-800' :
                                                mark.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {mark.score}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(mark.timestamp).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarkEntry; 