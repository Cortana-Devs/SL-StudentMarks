import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    User as FirebaseUser,
    UserCredential
} from 'firebase/auth';
import { createUser, getUser } from '../services/realtimeDatabase';
import { User, UserRole } from '../types';
import { auth } from '../firebase';
import { toast } from 'react-hot-toast';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signup: (email: string, password: string, role: UserRole, name: string, grade?: number) => Promise<void>;
    login: (email: string, password: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const signup = async (email: string, password: string, role: UserRole, name: string, grade?: number) => {
        try {
            const { user } = await createUserWithEmailAndPassword(auth, email, password);
            
            const userData: User = {
                uid: user.uid,
                email: user.email!,
                role,
                name,
                ...(grade && { grade })
            };

            await createUser(user.uid, userData);
            toast.success('Account created successfully!');
        } catch (error) {
            console.error('Signup error:', error);
            toast.error('Failed to create account');
            throw error;
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to log out');
            throw error;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            try {
                if (user) {
                    const userData = await getUser(user.uid);
                    if (userData) {
                        setCurrentUser(userData as User);
                    }
                } else {
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error('Auth state change error:', error);
                toast.error('Authentication error occurred');
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}; 