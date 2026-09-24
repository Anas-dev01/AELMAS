import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = ({ role, onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // Determine where the "Register" link should go based on the role prop
    const registerPath = role === 'Staff' ? '/register' : `/${role.toLowerCase()}/register`;

    const handleLogin = async (e) => {
        e.preventDefault(); 
        try {
            const response = await axios.post('http://localhost:5000/api/login', {
                email,
                password
            });

            // If the backend returns a valid user object
            if (response.data.user) {
                // This call now triggers the state save AND localStorage in App.jsx
                onLoginSuccess(response.data.user); 
                
                // Role-based navigation logic
                if (role === 'Registrar') {
                    navigate('/registrar/dashboard');
                } else if (role === 'HOD') {
                    navigate('/hod/dashboard');
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (error) {
            // Handle server-side errors or invalid credentials
            setMessage(error.response?.data?.message || "Login failed");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <form onSubmit={handleLogin} className="p-8 bg-white shadow-md rounded-lg w-full max-w-md border-t-4 border-[#672A0C]">
                <h2 className="text-2xl font-bold mb-6 text-center text-[#672A0C]">
                    {role} Login Portal
                </h2>
                
                <input 
                    type="email" 
                    placeholder="University Email" 
                    className="w-full p-2 mb-4 border rounded focus:outline-[#672A0C]"
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                />
                
                <input 
                    type="password" 
                    placeholder="Password" 
                    className="w-full p-2 mb-4 border rounded focus:outline-[#672A0C]"
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                />

                <button type="submit" className="w-full bg-[#672A0C] text-white p-2 rounded hover:bg-[#52210a] font-bold transition duration-200">
                    Login as {role}
                </button>

                {message && <p className="mt-4 text-center text-red-500 font-semibold">{message}</p>}
                
                {/* DYNAMIC REGISTRATION LINK */}
                <div className="mt-6 text-center text-sm border-t pt-4">
                    <p className="text-gray-600">
                        New {role}? <Link to={registerPath} className="text-[#672A0C] font-bold hover:underline">Register here</Link>
                    </p>
                </div>

                <p className="mt-6 text-[10px] text-center text-gray-400 uppercase tracking-widest">
                    AELMAS Secure Gateway: {role}
                </p>
            </form>
        </div>
    );
};

export default Login;