// import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
// import {
//     onAuthStateChanged,
//     signInWithEmailAndPassword,
//     createUserWithEmailAndPassword,
//     signOut
// } from 'firebase/auth';
// import { FIREBASE_AUTH } from "../FirebaseConfig";

// const initialState = {
//     isAuthenticated: undefined,
//     user: null,
//     loading: true,
//     login: async () => { },
//     signUp: async () => { },
//     logout: async () => { }
// }

// type AuthContextType = {
//     isAuthenticated: boolean | undefined;
//     loading: boolean;
//     user: any;
//     login: (email: string, password: string) => Promise<void>
//     signUp: (email: string, password: string) => Promise<void>
//     logout: () => Promise<void>
// }

// const AuthContext = createContext<AuthContextType>(initialState);

// interface Props extends PropsWithChildren { }

// const AuthProvider: React.FC<Props> = ({ children }) => {

//     const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>();
//     const [loading, setLoading] = useState(true);
//     const [user, setUser] = useState<any>(null);


//     useEffect(() => {
//         const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
//             if (user) {
//                 setUser(user);
//                 setIsAuthenticated(true);
//             } else {
//                 setUser(null);
//                 setIsAuthenticated(false);
//             }
//             setLoading(false);
//         });

//         return () => unsubscribe();
//     }, []);

//     const login = async (email: string, password: string) => {
//         try {
//             await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
//         } catch (error) {
//             console.error(error);
//         }
//     }

//     const signUp = async (email: string, password: string) => {
//         try {
//             await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
//         } catch (error) {
//             console.error(error);
//         }
//     }

//     const logout = async () => {
//         try {
//             await signOut(FIREBASE_AUTH);
//         } catch (error) {
//             console.error(error);
//         }
//     }

//     return (
//         <AuthContext.Provider value={{
//             isAuthenticated,
//             loading,
//             user,
//             login,
//             signUp,
//             logout
//         }}>
//             {children}
//         </AuthContext.Provider>
//     )

// }

// export default AuthProvider;

// export const useAuth = () => {
//     const context = useContext(AuthContext);

//     if (!context) {
//         throw new Error('useAuth must be accessible within the AuthProvider');
//     }

//     return context;
// }