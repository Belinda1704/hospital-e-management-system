import { useState, useEffect } from 'react';
import api from '../services/api';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  let user = {};
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
    user = JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user data:', e);
  }

  const canAssign = ['admin', 'nurse'].includes(user.role);

  useEffect(() => {
    fetchPatients();
    if (canAssign) {
      fetchDoctors();
      fetchNurses();
    }
  }, [search]);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients', { params: { search } });
      setPatients(response.data);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/staff', { params: { role: 'doctor' } });
      setDoctors(response.data);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const fetchNurses = async () => {
    try {
      const response = await api.get('/staff', { params: { role: 'nurse' } });
      setNurses(response.data);
    } catch (error) {
      console.error('Failed to fetch nurses:', error);
    }
  };

  const handleAssign = async (patientId, doctorId, nurseId) => {
    setError('');
    setSuccess('');
    setAssigning(true);
    try {
      await api.put(`/patients/${patientId}`, {
        assigned_doctor_id: doctorId || null,
        assigned_nurse_id: nurseId || null,
      });
      setSuccess('Assignment updated successfully.');
      setSelectedPatient(null);
      fetchPatients();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Patients</h1>
        <input
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      {error && <div className="rounded bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}
      {success && <div className="rounded bg-green-50 border border-green-200 text-green-700 text-sm p-3">{success}</div>}

      {selectedPatient && canAssign && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Assign Staff to {selectedPatient.first_name} {selectedPatient.last_name}
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Doctor</label>
              <select
                id="assign-doctor"
                className="w-full border rounded px-3 py-2"
                defaultValue={selectedPatient.assigned_doctor_id || ''}
              >
                <option value="">None</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.first_name} {doc.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Nurse</label>
              <select
                id="assign-nurse"
                className="w-full border rounded px-3 py-2"
                defaultValue={selectedPatient.assigned_nurse_id || ''}
              >
                <option value="">None</option>
                {nurses.map((nurse) => (
                  <option key={nurse.id} value={nurse.id}>
                    {nurse.first_name} {nurse.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const doctorId = document.getElementById('assign-doctor').value;
                const nurseId = document.getElementById('assign-nurse').value;
                handleAssign(selectedPatient.id, doctorId, nurseId);
              }}
              disabled={assigning}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {assigning ? 'Saving...' : 'Save Assignment'}
            </button>
            <button
              onClick={() => setSelectedPatient(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Patient ID</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Assigned Doctor</th>
              <th className="p-4 text-left">Assigned Nurse</th>
              <th className="p-4 text-left">Status</th>
              {canAssign && <th className="p-4 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} className="border-b">
                <td className="p-4">{patient.patient_id}</td>
                <td className="p-4">{patient.first_name} {patient.last_name}</td>
                <td className="p-4">{patient.email}</td>
                <td className="p-4">
                  {patient.assigned_doctor_name 
                    ? `${patient.assigned_doctor_name} ${patient.assigned_doctor_last_name || ''}`.trim()
                    : '-'}
                </td>
                <td className="p-4">
                  {patient.assigned_nurse_name 
                    ? `${patient.assigned_nurse_name} ${patient.assigned_nurse_last_name || ''}`.trim()
                    : '-'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    patient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {patient.status}
                  </span>
                </td>
                {canAssign && (
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedPatient(patient)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Assign Staff
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {patients.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500 text-sm" colSpan={canAssign ? 7 : 6}>No patients found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Patients;

