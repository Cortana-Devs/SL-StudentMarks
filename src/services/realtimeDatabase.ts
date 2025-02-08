import { 
    ref, 
    set, 
    get, 
    push, 
    update, 
    remove,
    query, 
    orderByChild, 
    equalTo,
    DataSnapshot
} from 'firebase/database';
import { database } from '../firebase';
import { Mark, Student, Subject, User } from '../types';
import { SUBJECTS } from '../constants/subjects';

// Initialize Subjects
export const initializeSubjects = async () => {
    const subjectsRef = ref(database, 'subjects');
    
    try {
        const snapshot = await get(subjectsRef);
        if (!snapshot.exists()) {
            const subjectsData = SUBJECTS.map(name => ({
                name,
                active: true
            }));
            
            await set(subjectsRef, subjectsData);
        }
    } catch (error) {
        console.error('Error initializing subjects:', error);
        throw error;
    }
};

// User Operations
export const createUser = async (userId: string, userData: User) => {
    const userRef = ref(database, `users/${userId}`);
    await set(userRef, userData);
};

export const getUser = async (userId: string) => {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
};

// Student Operations
export const getStudentsByGrade = async (grade: number) => {
    const usersRef = ref(database, 'users');
    const gradeQuery = query(usersRef, orderByChild('grade'), equalTo(grade));
    
    const snapshot = await get(gradeQuery);
    const students: Student[] = [];
    
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            const student = childSnapshot.val();
            if (student.role === 'student') {
                students.push({
                    id: childSnapshot.key!,
                    ...student
                });
            }
        });
    }
    
    return students;
};

// Mark Operations
export const addMark = async (markData: Omit<Mark, 'id'>) => {
    const marksRef = ref(database, 'marks');
    const newMarkRef = push(marksRef);
    
    await set(newMarkRef, {
        ...markData,
        timestamp: Date.now()
    });
    
    return {
        id: newMarkRef.key!,
        ...markData
    };
};

export const updateMark = async (markId: string, updates: Partial<Mark>) => {
    const markRef = ref(database, `marks/${markId}`);
    await update(markRef, {
        ...updates,
        timestamp: Date.now()
    });
};

export const getStudentMarks = async (studentId: string) => {
    const marksRef = ref(database, 'marks');
    const studentMarksQuery = query(marksRef, orderByChild('studentId'), equalTo(studentId));
    
    const snapshot = await get(studentMarksQuery);
    const marks: Mark[] = [];
    
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
            marks.push({
                id: childSnapshot.key!,
                ...childSnapshot.val()
            });
        });
    }
    
    return marks.sort((a, b) => b.timestamp - a.timestamp);
};

// Subject Operations
export const getSubjects = async (grade: number) => {
    const subjectsRef = ref(database, 'subjects');
    const snapshot = await get(subjectsRef);
    
    const subjects: Subject[] = [];
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot: DataSnapshot) => {
            if (childSnapshot.key) {
                subjects.push({
                    id: childSnapshot.key,
                    name: childSnapshot.val().name,
                    grade
                });
            }
        });
    }
    
    return subjects;
};

export const addSubject = async (subjectData: Omit<Subject, 'id'>) => {
    const subjectsRef = ref(database, 'subjects');
    const newSubjectRef = push(subjectsRef);
    
    await set(newSubjectRef, subjectData);
    return {
        id: newSubjectRef.key!,
        ...subjectData
    };
};

export const updateSubject = async (subjectId: string, updates: Partial<Subject>) => {
    const subjectRef = ref(database, `subjects/${subjectId}`);
    await update(subjectRef, updates);
};

export const deleteSubject = async (subjectId: string) => {
    // Delete the subject
    const subjectRef = ref(database, `subjects/${subjectId}`);
    await remove(subjectRef);
    
    // Delete all marks associated with this subject
    const marksRef = ref(database, 'marks');
    const marksQuery = query(marksRef, orderByChild('subjectId'), equalTo(subjectId));
    const snapshot = await get(marksQuery);
    
    if (snapshot.exists()) {
        const updates: { [key: string]: null } = {};
        snapshot.forEach((childSnapshot) => {
            updates[`marks/${childSnapshot.key}`] = null;
        });
        await update(ref(database), updates);
    }
};

// Initialize Database Structure
export const initializeDatabaseStructure = async () => {
    try {
        // Check if the database structure exists
        const dbRef = ref(database);
        const snapshot = await get(dbRef);
        
        if (!snapshot.exists()) {
            // Initialize with default structure
            const initialData = {
                users: {},
                marks: {},
                subjects: {}
            };

            // First create the basic structure
            await set(dbRef, initialData);

            // Then initialize subjects
            const subjectsRef = ref(database, 'subjects');
            const subjectsData = SUBJECTS.reduce((acc, name) => {
                acc[name.toLowerCase().replace(/\s+/g, '_')] = {
                    name,
                    active: true
                };
                return acc;
            }, {} as Record<string, { name: string; active: boolean }>);

            await set(subjectsRef, subjectsData);
            console.log('Database initialized with default structure');
        } else {
            console.log('Database structure already exists');
        }
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}; 