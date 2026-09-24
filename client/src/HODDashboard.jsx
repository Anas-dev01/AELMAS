import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';

const API_URL = 'http://localhost:5000/api';

const formatDate = (value) => {
    const match = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const HODDashboard = ({ user, onLogout }) => {
    const [requests, setRequests] = useState([]);
    const [reportRequests, setReportRequests] = useState([]);
    const [error, setError] = useState('');
    const [reportWarning, setReportWarning] = useState('');

    const fetchRequests = useCallback(async () => {
        try {
            const pendingResponse = await axios.get(`${API_URL}/leave-requests/pending`);
            setRequests(pendingResponse.data);
            setError('');
        } catch (err) {
            console.error('Unable to load HOD dashboard', err);
            setError('Unable to load leave information. Please refresh the page.');
            return;
        }

        try {
            const reportResponse = await axios.get(`${API_URL}/leave-requests/report`);
            setReportRequests(reportResponse.data);
            setReportWarning('');
        } catch (err) {
            // Analytics are optional; a report failure must not interrupt HOD decisions.
            console.warn('Leave report is currently unavailable', err);
            setReportRequests([]);
            setReportWarning('Analytics and the full report will be available after the API server is restarted. The review queue remains available.');
        }
    }, []);

    useEffect(() => {
        // Data is received asynchronously before state is updated.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchRequests();
    }, [fetchRequests]);

    const handleApprove = async (id) => {
        const remarks = prompt('Enter HOD remarks:');
        if (!remarks) return;
        try {
            await axios.post(`${API_URL}/leave-requests/approve-hod`, { request_id: id, remarks });
            fetchRequests();
        } catch (err) {
            console.error('Unable to recommend request', err);
            alert('Unable to recommend this request. Please try again.');
        }
    };

    const handleReject = async (id) => {
        const remarks = prompt('Enter reason for rejection:');
        if (!remarks) return;
        try {
            await axios.post(`${API_URL}/leave-requests/reject`, { request_id: id, remarks, role: 'HOD' });
            fetchRequests();
        } catch (err) {
            console.error('Unable to reject request', err);
            alert('Unable to reject this request. Please try again.');
        }
    };

    const analyticsSource = reportRequests.length ? reportRequests : requests;
    const analytics = {
        total: analyticsSource.length,
        recommended: analyticsSource.filter((request) => [1, 2].includes(request.status_stage)).length,
        rejected: analyticsSource.filter((request) => request.status_stage === 3).length,
        awaiting: analyticsSource.filter((request) => request.status_stage === 0).length
    };

    const downloadReport = () => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.getHeight();
        let y = 20;
        const addPageIfNeeded = () => {
            if (y > pageHeight - 18) {
                doc.addPage();
                y = 20;
            }
        };
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text('CUSTECH LEAVE MANAGEMENT SYSTEM', 105, y, { align: 'center' });
        y += 7;
        doc.setFontSize(12);
        doc.text('HOD LEAVE ACTIVITY REPORT', 105, y, { align: 'center' });
        y += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Generated: ${new Date().toLocaleString()}  |  Prepared for: ${user.name}`, 15, y);
        y += 9;
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: ${analytics.total}   Recommended: ${analytics.recommended}   Rejected: ${analytics.rejected}   Awaiting HOD: ${analytics.awaiting}`, 15, y);
        y += 10;
        doc.text('Staff member', 15, y); doc.text('Leave dates', 75, y); doc.text('Status', 140, y);
        y += 3;
        doc.line(15, y, 195, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        analyticsSource.forEach((request) => {
            addPageIfNeeded();
            const status = request.status_stage === 0 ? 'Awaiting HOD' : request.status_stage === 1 ? 'Recommended' : request.status_stage === 2 ? 'Approved' : 'Rejected';
            doc.text(doc.splitTextToSize(request.full_name, 52), 15, y);
            doc.text(`${formatDate(request.start_date)} - ${formatDate(request.end_date)}`, 75, y);
            doc.text(status, 140, y);
            y += 8;
        });
        doc.save(`CUSTECH_HOD_Leave_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-[#672A0C] px-4 py-4 text-white shadow-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <h1 className="font-bold">AELMAS | HOD Panel</h1>
                    <button onClick={onLogout} className="rounded bg-red-500 px-3 py-1 font-medium hover:bg-red-600">Logout</button>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl p-5 md:p-8">
                <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div><p className="text-sm font-semibold uppercase tracking-wider text-[#672A0C]">Department review</p><h2 className="text-3xl font-bold text-gray-900">Welcome, {user.name}</h2></div>
                    <button onClick={downloadReport} className="rounded-lg bg-[#672A0C] px-4 py-2 font-bold text-white shadow hover:bg-[#52210a]">Download full report</button>
                </div>

                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Total leaves" value={analytics.total} detail="All submitted applications" color="border-[#672A0C]" />
                    <StatCard label="Recommended" value={analytics.recommended} detail="Sent onward or finally approved" color="border-blue-500" />
                    <StatCard label="Rejected" value={analytics.rejected} detail="Closed applications" color="border-red-500" />
                    <StatCard label="Awaiting review" value={analytics.awaiting} detail="Requires HOD action" color="border-amber-500" />
                </section>

                {error && <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
                {reportWarning && <p className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">{reportWarning}</p>}
                <section className="overflow-hidden rounded-xl bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b bg-gray-50 p-5"><div><h3 className="font-bold text-gray-800">Pending leave applications</h3></div><span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700">{requests.length} pending</span></div>
                    <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600"><tr><th className="p-4">Staff member</th><th className="p-4">Leave type</th><th className="p-4">Leave period</th><th className="p-4 text-center">Decision</th></tr></thead><tbody className="divide-y">{requests.map((request) => <tr key={request.request_id} className="hover:bg-gray-50"><td className="p-4 font-semibold">{request.full_name}</td><td className="p-4">{request.leave_type}</td><td className="p-4 text-sm">{formatDate(request.start_date)} to {formatDate(request.end_date)}</td><td className="p-4"><div className="flex justify-center gap-2"><button onClick={() => handleApprove(request.request_id)} className="rounded bg-green-600 px-3 py-2 text-sm font-bold text-white hover:bg-green-700">Recommend</button><button onClick={() => handleReject(request.request_id)} className="rounded bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700">Reject</button></div></td></tr>)}</tbody></table></div>
                    {requests.length === 0 && <p className="p-10 text-center text-gray-500">No applications are awaiting HOD review.</p>}
                </section>
            </main>
        </div>
    );
};

const StatCard = ({ label, value, detail, color }) => <div className={`rounded-xl border-t-4 ${color} bg-white p-5 shadow`}><p className="text-sm font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-2 text-4xl font-black text-gray-900">{value}</p><p className="mt-1 text-sm text-gray-500">{detail}</p></div>;

export default HODDashboard;
