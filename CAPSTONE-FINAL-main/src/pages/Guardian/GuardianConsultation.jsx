import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const GuardianConsultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/api/get-consultations`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        // Filter out past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of the day
        const filteredData = response.data.consultations.filter((consultation) => {
          const consultationDate = new Date(consultation.date);
          return consultationDate >= today; // Keep only present and future dates
        });

        setConsultations(filteredData); // Update state with filtered data
      } catch (error) {
        console.error('Error fetching consultations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, []);

  const handleSortOrderToggle = () => {
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };

  const sortConsultations = (consultations) => {
    return consultations.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'time') {
        comparison = new Date(`1970-01-01T${a.timeStart}`) - new Date(`1970-01-01T${b.timeStart}`);
      } else if (sortBy === 'patient') {
        comparison = a.patientFullName.localeCompare(b.patientFullName);
      } else if (sortBy === 'guardian') {
        comparison = a.guardianFullName.localeCompare(b.guardianFullName);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const filteredConsultations = sortConsultations(consultations).filter((consultation) => {
    const nameMatch = `${consultation.patientFullName} ${consultation.guardianFullName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const statusMatch = statusFilter
      ? consultation.status.toLowerCase() === statusFilter.toLowerCase()
      : true;

    const statusSearchMatch = searchTerm
      ? consultation.status.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    return (nameMatch || statusSearchMatch) && statusMatch;
  });

  if (loading) {
    return <div className="text-center text-lg">Loading consultations...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6 text-center">Guardian Consultations Dashboard</h2>

      <div className="flex items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-green-300"
        />

        <button
          onClick={handleSortOrderToggle}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring focus:ring-green-300 hover:border-green-500 hover:bg-green-50"
        >
          {sortOrder === 'asc' ? (
            <span className="text-green-500">↑</span>
          ) : (
            <span className="text-green-500">↓</span>
          )}
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-green-300 hover:border-green-500 hover:bg-green-50"
        >
          <option value="date">Date</option>
          <option value="time">Time</option>
          <option value="patient">Patient</option>
          <option value="guardian">Guardian</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-green-300 hover:border-green-500 hover:bg-green-50"
        >
          <option value="">Filter by Status</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="declined">declined</option>
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full table-auto text-left text-sm text-gray-500">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Consultation ID</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Patient</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Guardian</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredConsultations.map((consultation) => (
              <tr key={consultation.consultationId} className="border-b hover:bg-green-50">
                <td className="px-6 py-4">{consultation.consultationId}</td>
                <td className="px-6 py-4">{consultation.patientFullName}</td>
                <td className="px-6 py-4">{consultation.guardianFullName}</td>
                <td className="px-6 py-4">{new Date(consultation.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  {consultation.timeStart} - {consultation.timeEnd}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      consultation.status.toLowerCase() === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : consultation.status.toLowerCase() === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {consultation.status}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => navigate(`/guardian/get-consultation-details/${consultation.consultationId}`)}
                    className="bg-blue-600 text-white py-1 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuardianConsultations;
