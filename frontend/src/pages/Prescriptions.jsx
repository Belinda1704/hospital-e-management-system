import { useState, useEffect } from 'react';
import api from '../services/api';

const defaultForm = {
  patient_id: '',
  medication_name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
};

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(defaultForm);
  
  let user = {};
  try {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
    user = JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing user data:', e);
  }

  const isDoctor = user.role === 'doctor';
  const isPatient = user.role === 'patient';
  const canCreate = ['admin', 'doctor'].includes(user.role);

  useEffect(() => {
    fetchPrescriptions();
    if (canCreate) {
      fetchPatients();
    }
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const params = isDoctor ? { doctor_id: user.id } : isPatient ? {} : {};
      const response = await api.get('/prescriptions', { params });
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      if (!form.patient_id || !form.medication_name) {
        setError('Patient and medication name are required.');
        setSaving(false);
        return;
      }
      await api.post('/prescriptions', {
        ...form,
        doctor_id: user.id, // Current doctor creating prescription
      });
      setSuccess('Prescription created successfully.');
      setForm(defaultForm);
      fetchPrescriptions();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create prescription');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Prescriptions</h1>

      {canCreate && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Prescription</h2>
          {error && <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}
          {success && <div className="mb-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm p-3">{success}</div>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
              <select name="patient_id" value={form.patient_id} onChange={handleChange} required className="w-full border rounded px-3 py-2">
                <option value="">Select patient</option>
                {patients.map((pat) => (
                  <option key={pat.id} value={pat.id}>
                    {pat.first_name} {pat.last_name} ({pat.patient_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name *</label>
              <input name="medication_name" value={form.medication_name} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                <input name="dosage" value={form.dosage} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="e.g., 500mg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <input name="frequency" value={form.frequency} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="e.g., Twice daily" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input name="duration" value={form.duration} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="e.g., 7 days" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea name="instructions" value={form.instructions} onChange={handleChange} className="w-full border rounded px-3 py-2" rows="3" placeholder="Additional instructions for the patient..." />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Prescription'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Patient</th>
              <th className="p-4 text-left">Medication</th>
              <th className="p-4 text-left">Dosage</th>
              <th className="p-4 text-left">Frequency</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((pres) => (
              <tr key={pres.id} className="border-b">
                <td className="p-4">{pres.patient_first_name} {pres.patient_last_name}</td>
                <td className="p-4">{pres.medication_name}</td>
                <td className="p-4">{pres.dosage}</td>
                <td className="p-4">{pres.frequency}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    pres.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {pres.status}
                  </span>
                </td>
              </tr>
            ))}
            {prescriptions.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500 text-sm" colSpan={5}>No prescriptions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Prescriptions;

