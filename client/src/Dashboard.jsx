import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import LeaveForm from './LeaveForm';
import { jsPDF } from "jspdf";

const Dashboard = ({ user, onLogout }) => {
  const [showForm, setShowForm] = useState(false);
  const [myRequests, setMyRequests] = useState([]);

  const fetchMyRequests = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/my-requests/${user.id}`);
      setMyRequests(res.data);

      const balanceRes = await axios.get(`http://localhost:5000/api/user-data/${user.id}`);
      if (balanceRes.data) {
        const updatedUser = { ...user, leave_balance: balanceRes.data.leave_balance };
        localStorage.setItem('aelmas_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Error syncing dashboard data", err);
    }
  }, [user]);

  useEffect(() => {
    // The request resolves asynchronously; the callback then updates the dashboard state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMyRequests();
  }, [fetchMyRequests]);

  const generatePDF = (req) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const toLocalCalendarDate = (value) => {
      const match = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
    };
    const formatDate = (value) => toLocalCalendarDate(value).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    const leaveEnd = toLocalCalendarDate(req.end_date);
    leaveEnd.setDate(leaveEnd.getDate() + 1);
    const resumptionDate = formatDate(leaveEnd);
    const applicationDate = req.created_at ? formatDate(req.created_at) : formatDate(new Date());
    const paragraph = (text, y) => {
      const lines = doc.splitTextToSize(text, 165);
      doc.text(lines, 22, y);
      return y + (lines.length * 6) + 5;
    };

    doc.setFillColor(103, 42, 12);
    doc.rect(0, 0, pageWidth, 13, 'F');
    doc.setTextColor(103, 42, 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('CONFLUENCE UNIVERSITY OF SCIENCE AND TECHNOLOGY', pageWidth / 2, 24, { align: 'center' });
    doc.setFontSize(11);
    doc.text('OSARA, KOGI STATE', pageWidth / 2, 30, { align: 'center' });
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.text('OFFICIAL LEAVE MANAGEMENT SYSTEM', pageWidth / 2, 39, { align: 'center' });
    doc.setFontSize(13);
    doc.text('OFFICIAL APPROVAL LETTER', pageWidth / 2, 47, { align: 'center' });
    doc.setDrawColor(103, 42, 12);
    doc.setLineWidth(0.8);
    doc.line(20, 52, 190, 52);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text(`Date: ${formatDate(new Date())}`, 22, 64);
    doc.setFont('helvetica', 'bold');
    doc.text('Subject: Approval of Leave Application', 22, 76);
    doc.setFont('helvetica', 'normal');

    let y = 89;
    y = paragraph(`Dear ${user.name},`, y);
    y = paragraph(`This is to formally acknowledge receipt of your leave application dated ${applicationDate}.`, y);
    y = paragraph(`I am pleased to inform you that Management has approved your request for ${req.leave_type.toLowerCase()} leave. Your leave is scheduled to commence on ${formatDate(req.start_date)} and will end on ${formatDate(req.end_date)}. You are expected to resume your official duties on ${resumptionDate}.`, y);
    y = paragraph('Please ensure that all pending responsibilities are properly handed over before the commencement of your leave.', y);
    y = paragraph('Management appreciates your commitment and wishes you a restful and productive leave period. Congratulations on the approval of your leave application.', y);
    y += 3;
    doc.text('Yours faithfully,', 22, y);

    // Keep the signatory block immediately below the closing, like a formal letter.
    const signatureY = y + 8;
    if (req.registrar_signature) {
      try {
        const imageType = req.registrar_signature.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(req.registrar_signature, imageType, 22, signatureY, 48, 20);
      } catch (error) {
        console.warn('Registrar signature could not be added to the letter.', error);
      }
    }
    doc.setDrawColor(70, 70, 70);
    doc.line(22, signatureY + 21, 75, signatureY + 21);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRAR', 22, signatureY + 28);
    doc.setFont('helvetica', 'normal');
    doc.save(`Leave_Approval_${user.name}.pdf`);
  };
  
  const getStatus = (stage) => {
    if (stage === 0) return { text: "Pending HOD", color: "text-yellow-600 bg-yellow-100" };
    if (stage === 1) return { text: "Recommended", color: "text-blue-600 bg-blue-100" };
    if (stage === 2) return { text: "Final Approved", color: "text-green-600 bg-green-100" };
    if (stage === 3) return { text: "Rejected", color: "text-red-600 bg-red-100" };
    return { text: "Unknown", color: "text-gray-600 bg-gray-100" };
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      <nav className="bg-[#672A0C] text-white p-4 flex justify-between shadow-lg">
        <h1 className="text-xl font-bold">AELMAS | Staff Portal</h1>
        <button onClick={onLogout} className="bg-red-500 px-4 py-1 rounded">Logout</button>
      </nav>

      <div className="p-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-semibold mb-6">Welcome, {user.name}!</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow border-t-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-bold">LEAVE BALANCE</h3>
            <p className="text-4xl font-black text-green-600">{user.leave_balance} Days</p>
          </div>
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow border-t-4 border-[#672A0C] flex items-center justify-between">
            <div>
              <h3 className="font-bold">Need time off?</h3>
              <p className="text-gray-500">Submit your application for HOD review.</p>
            </div>
            <button onClick={() => setShowForm(true)} className="bg-[#672A0C] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#52210a] transition">
              Apply Now
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-bold text-gray-700">My Leave Applications</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-sm uppercase text-gray-600">
                <th className="p-4">Type</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            {myRequests.map((req) => (
              <React.Fragment key={req.request_id}>
                <tr className="hover:bg-gray-50 transition">
                  <td className="p-4 font-medium">{req.leave_type}</td>
                  <td className="p-4 text-sm">
                    {req.start_date.split('T')[0]} to {req.end_date.split('T')[0]}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatus(req.status_stage).color}`}>
                      {getStatus(req.status_stage).text}
                    </span>
                  </td>
                  <td className="p-4">
                    {req.status_stage === 2 ? (
                      <button 
                        onClick={() => generatePDF(req)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition"
                      >
                        PDF Letter
                      </button>
                    ) : req.status_stage === 3 ? (
                      <span className="text-red-500 text-xs font-bold">Closed</span>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Processing...</span>
                    )}
                  </td>
                </tr>
                
                {(req.hod_remarks || req.registrar_remarks) && (
                  <tr className="bg-gray-50">
                    <td colSpan="4" className="p-3 text-xs text-gray-600 border-l-4 border-blue-400">
                      {req.hod_remarks && <p><strong>HOD Remark:</strong> {req.hod_remarks}</p>}
                      {req.registrar_remarks && <p><strong>Registrar Remark:</strong> {req.registrar_remarks}</p>}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          </table>
          {myRequests.length === 0 && <p className="p-10 text-center text-gray-400">No applications found.</p>}
        </div>
      </div>

      {/* POPUP MODAL INTEGRATION */}
      {showForm && (
        <LeaveForm 
          user={user} 
          onBack={() => {
            setShowForm(false);
            fetchMyRequests(); // Automatically pull new requests when closed
          }} 
        />
      )}
    </div>
  );
};

export default Dashboard;
