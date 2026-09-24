import React, { useState } from 'react';
import axios from 'axios';

const LeaveForm = ({ user, onBack }) => {
    const [formData, setFormData] = useState({
        leave_type: 'Annual',
        start_date: '',
        end_date: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        if (start < today) {
            alert("Error: Start date cannot be in the past.");
            return;
        }

        if (end < start) {
            alert("Error: End date must be after the start date.");
            return;
        }

        const diffTime = Math.abs(end - start);
        const requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        let limit = 0;
        if (formData.leave_type === 'Annual') limit = 30;
        else if (formData.leave_type === 'Sick') limit = 12;
        else if (formData.leave_type === 'Casual') limit = 7;

        if (requestedDays > limit) {
            alert(`Error: ${formData.leave_type} Leave cannot exceed ${limit} days. You requested ${requestedDays} days.`);
            return;
        }

        if (requestedDays > user.leave_balance) {
            alert(`Error: Insufficient balance. You only have ${user.leave_balance} days remaining.`);
            return;
        }

        try {
            const res = await axios.post('http://localhost:5000/api/leave-request', {
                ...formData,
                user_id: user.id,
                requested_days: requestedDays 
            });
            alert(res.data.message);
            onBack(); 
        } catch (err) {
            alert("Failed to submit request: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-xl border-t-4 border-[#672A0C]">
                <h2 className="text-2xl font-bold mb-6 text-[#672A0C]">Apply for Leave</h2>
                <form onSubmit={handleSubmit}>
                    <label className="block mb-2 text-sm font-bold text-gray-700">Leave Type</label>
                    <select 
                        className="w-full p-2 mb-4 border rounded focus:outline-[#672A0C] text-gray-800 bg-white"
                        value={formData.leave_type}
                        onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                    >
                        <option value="Annual">Annual Leave (30 Days)</option>
                        <option value="Sick">Sick Leave (12 Days)</option>
                        <option value="Casual">Casual Leave (7 Days)</option>
                    </select>

                    <label className="block mb-2 text-sm font-bold text-gray-700">Start Date</label>
                    <input 
                        type="date" 
                        className="w-full p-2 mb-4 border rounded focus:outline-[#672A0C] text-gray-800" 
                        required
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})} 
                    />

                    <label className="block mb-2 text-sm font-bold text-gray-700">End Date</label>
                    <input 
                        type="date" 
                        className="w-full p-2 mb-4 border rounded focus:outline-[#672A0C] text-gray-800" 
                        required
                        onChange={(e) => setFormData({...formData, end_date: e.target.value})} 
                    />

                    <div className="flex justify-between items-center mt-6">
                        <button 
                            type="button" 
                            onClick={onBack} 
                            className="text-gray-500 hover:text-gray-800 font-medium transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="bg-[#672A0C] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#52210a] transition shadow-md"
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeaveForm;