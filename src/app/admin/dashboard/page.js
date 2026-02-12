'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../utils/supabaseClient';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    fetchSubmissions(token);
  }, [router]);

  useEffect(() => {
    // Filter submissions based on search term
    if (searchTerm) {
      const filtered = submissions.filter(sub =>
        sub.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.comments?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSubmissions(filtered);
    } else {
      setFilteredSubmissions(submissions);
    }
  }, [searchTerm, submissions]);

  const fetchSubmissions = async (token) => {
    try {
      const response = await fetch('/api/admin/submissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        router.push('/admin');
        return;
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
      setFilteredSubmissions(data.submissions || []);
    } catch (err) {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin');
  };

  const exportToExcel = () => {
    // Flatten data for Excel
    const data = filteredSubmissions.map(sub => ({
      'Date': new Date(sub.created_at).toLocaleDateString(),
      'Time': new Date(sub.created_at).toLocaleTimeString(),
      'Name': sub.full_name,
      'Company': sub.company_name,
      'Sector': sub.sector || '-',
      'Position': sub.position || '-',
      'Email': sub.email,
      'Phone': sub.phone_number || '-',
      'Satisfaction': sub.satisfaction_overall,
      'Material Usefulness': sub.material_usefulness,
      'Recommend': sub.recommend_colleagues,
      '1-on-1 Session': sub.one_on_one_session || '-',
      'Privacy Consent': sub.privacy_consent ? 'Yes' : 'No',
      'Marketing Consent': sub.marketing_consent ? 'Yes' : 'No',
      'Comments': sub.comments || '-'
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");

    // Generate Excel file
    XLSX.writeFile(wb, `feedback_submissions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1e28] via-[#20242F] to-[#1a1e28] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1e28] via-[#20242F] to-[#1a1e28] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#2b303b] rounded-2xl shadow-2xl p-6 mb-6 border border-gray-700/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Feedback Submissions
              </h1>
              <p className="text-gray-400">
                Total: {filteredSubmissions.length} {searchTerm && `(filtered from ${submissions.length})`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToExcel}
                className="px-6 py-3 bg-[#67C23A] hover:bg-[#5aaa32] text-white font-semibold rounded-lg 
                     transition-all duration-300 shadow-lg hover:shadow-[#67C23A]/20"
              >
                Export Excel
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg 
                     transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-6">
            <input
              type="text"
              placeholder="Search by name, company, email, or comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#1a1e28] border border-gray-700 text-white placeholder-gray-500 
                   focus:outline-none focus:border-[#67C23A] focus:ring-2 focus:ring-[#67C23A]/20 
                   transition-all duration-300"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-[#2b303b] rounded-2xl shadow-2xl border border-gray-700/50">
          <div className="overflow-auto" style={{ maxHeight: '600px' }}>
            <table className="w-full table-auto">
              <thead className="bg-[#1a1e28] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Sector</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Satisfaction</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Material</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Recommend</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">1-on-1 Session</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                      No submissions found
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-[#1a1e28]/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                        {new Date(sub.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(sub.created_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {sub.full_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.company_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.sector || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.position || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.phone_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          parseInt(sub.satisfaction_overall) >= 4 
                            ? 'bg-green-500/20 text-green-400' 
                            : parseInt(sub.satisfaction_overall) >= 3
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {sub.satisfaction_overall}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          parseInt(sub.material_usefulness) >= 4 
                            ? 'bg-green-500/20 text-green-400' 
                            : parseInt(sub.material_usefulness) >= 3
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {sub.material_usefulness}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.recommend_colleagues}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {sub.one_on_one_session || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                        {sub.comments || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
