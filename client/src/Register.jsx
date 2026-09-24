import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // Import Link and useNavigate
import { Eye, EyeOff } from 'lucide-react'; 

const Register = ({ role, onRegisterSuccess }) => { 
    const [formData, setFormData] = useState({
        staff_id: '', 
        full_name: '', 
        email: '', 
        password: '', 
        role: role, 
        dept_id: 1,
        signature_data: ''
    });
    
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [strength, setStrength] = useState({ message: '', color: 'text-gray-400' });
    const navigate = useNavigate();

    // Determine the back-to-login link based on the role prop
    const loginPath = role === 'Staff' ? '/login' : `/${role.toLowerCase()}/login`;

    const handlePasswordChange = (val) => {
        setFormData({ ...formData, password: val });
        
        if (val.length === 0) {
            setStrength({ message: '', color: '' });
        } else if (val.length < 6) {
            setStrength({ message: 'Weak (Too short)', color: 'text-red-500' });
        } else if (/[A-Z]/.test(val) && /[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val)) {
            setStrength({ message: 'Strong', color: 'text-green-600' });
        } else {
            setStrength({ message: 'Medium (Add symbols & numbers)', color: 'text-orange-500' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (role === 'Registrar' && !formData.signature_data) {
            alert('Please upload the Registrar signature that will appear on approval letters.');
            return;
        }

        try {
            const res = await axios.post('http://localhost:5000/api/register', formData);
            alert(res.data.message);
            
            // Navigate to the correct login page after successful registration
            navigate(loginPath);
            
            if (onRegisterSuccess) onRegisterSuccess(); 
        } catch (err) {
            alert("Registration Failed: " + (err.response?.data?.message || err.message));
            console.log(err.response?.data);
        }
    };

    const handleSignatureChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!['image/png', 'image/jpeg'].includes(file.type)) {
            alert('Please upload a PNG or JPEG signature image.');
            event.target.value = '';
            return;
        }
        if (file.size > 1.5 * 1024 * 1024) {
            alert('The signature image must be 1.5 MB or smaller.');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setFormData((current) => ({ ...current, signature_data: reader.result }));
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <form onSubmit={handleSubmit} className="p-8 bg-white shadow-xl rounded-xl w-full max-w-md border-t-4 border-[#672A0C]">
                <h2 className="text-2xl font-bold mb-6 text-[#672A0C] text-center">{role} Account Registration</h2>
                
                <div className="mb-4 text-center text-sm text-gray-500 italic">
                    <p><strong>Account Type:</strong> {role}</p>
                </div>

                <input type="text" placeholder="Staff ID" className="w-full p-2 mb-3 border rounded focus:outline-[#672A0C]" 
                    onChange={e => setFormData({...formData, staff_id: e.target.value})} required />
                
                <input type="text" placeholder="Full Name" className="w-full p-2 mb-3 border rounded focus:outline-[#672A0C]" 
                    onChange={e => setFormData({...formData, full_name: e.target.value})} required />
                
                <input type="email" placeholder="Email" className="w-full p-2 mb-3 border rounded focus:outline-[#672A0C]" 
                    onChange={e => setFormData({...formData, email: e.target.value})} required />

                {role === 'Registrar' && (
                    <div className="mb-3 rounded border border-[#672A0C]/30 bg-amber-50 p-3">
                        <label htmlFor="signature" className="mb-1 block text-sm font-bold text-[#672A0C]">Official signature</label>
                        <p className="mb-2 text-xs text-gray-600">Upload a clear PNG or JPEG signature (maximum 1.5 MB). It will be attached to leave approval letters.</p>
                        <input id="signature" type="file" accept="image/png,image/jpeg" onChange={handleSignatureChange} className="block w-full text-sm" required />
                        {formData.signature_data && <img src={formData.signature_data} alt="Signature preview" className="mt-3 h-14 max-w-full object-contain object-left" />}
                    </div>
                )}

                <div className="relative mb-1">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Password" 
                        className="w-full p-2 border rounded pr-10 focus:outline-[#672A0C]" 
                        onChange={e => handlePasswordChange(e.target.value)} required 
                    />
                    <button 
                        type="button" 
                        className="absolute right-3 top-2.5 text-gray-400"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                <p className={`text-xs mb-3 font-bold ${strength.color}`}>{strength.message}</p>

                <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Confirm Password" 
                    className="w-full p-2 mb-3 border rounded focus:outline-[#672A0C]" 
                    onChange={e => setConfirmPassword(e.target.value)} required 
                />
                
                <button className="w-full bg-[#672A0C] text-white p-2 rounded font-bold hover:bg-[#52210a] transition duration-200 shadow-md">
                    Sign Up as {role}
                </button>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Already have an account? <Link to={loginPath} className="text-[#672A0C] font-bold hover:underline">Login here</Link></p>
                </div>
            </form>
        </div>
    );
};

export default Register;
