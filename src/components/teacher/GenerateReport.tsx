import React, { useState } from 'react';
import { Mark, Student, Subject } from '../../types';
import { getStudentMarks, getStudentsByGrade, getSubjects } from '../../services/realtimeDatabase';
import { toast } from 'react-hot-toast';

interface GenerateReportProps {
    grade: number;
}

const GenerateReport: React.FC<GenerateReportProps> = ({ grade }) => {
    const [loading, setLoading] = useState(false);

    const generateHTML = (students: Student[], marks: Mark[], subjects: Subject[]) => {
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Academic Report - Grade ${grade}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 12px;
                        text-align: left;
                    }
                    th {
                        background-color: #f8f9fa;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                    }
                    .student-section {
                        margin-bottom: 40px;
                    }
                    .score-high { color: #059669; }
                    .score-medium { color: #b45309; }
                    .score-low { color: #dc2626; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Academic Performance Report</h1>
                    <h2>Grade ${grade}</h2>
                    <p>Generated on ${new Date().toLocaleDateString()}</p>
                </div>
                
                ${students.map(student => {
                    const studentMarks = marks.filter(m => m.studentId === student.id);
                    return `
                        <div class="student-section">
                            <h3>${student.name}</h3>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Score</th>
                                        <th>Comments</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${subjects.map(subject => {
                                        const mark = studentMarks.find(m => m.subjectId === subject.id);
                                        if (!mark) return '';
                                        const scoreClass = mark.score >= 75 ? 'score-high' : 
                                                         mark.score >= 50 ? 'score-medium' : 'score-low';
                                        return `
                                            <tr>
                                                <td>${subject.name}</td>
                                                <td class="${scoreClass}">${mark.score}</td>
                                                <td>${mark.comment || '-'}</td>
                                                <td>${new Date(mark.timestamp).toLocaleDateString()}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }).join('')}
            </body>
            </html>
        `;
        return html;
    };

    const handleGenerateReport = async () => {
        try {
            setLoading(true);
            
            // Fetch all necessary data
            const [students, subjects] = await Promise.all([
                getStudentsByGrade(grade),
                getSubjects(grade)
            ]);

            // Fetch marks for all students
            const marksPromises = students.map(student => getStudentMarks(student.id));
            const marksArrays = await Promise.all(marksPromises);
            const marks = marksArrays.flat();

            // Generate HTML
            const html = generateHTML(students, marks, subjects);

            // Create blob and download
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `academic-report-grade-${grade}-${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Report generated successfully');
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                        Generate Report
                    </h3>
                    <p className="text-sm text-gray-500 max-w-lg">
                        Download a detailed academic report for Grade {grade}
                    </p>
                </div>
                <button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="btn btn-primary w-full sm:w-auto min-w-[140px]"
                >
                    {loading ? 'Generating...' : 'Generate Report'}
                </button>
            </div>
        </div>
    );
};

export default GenerateReport; 