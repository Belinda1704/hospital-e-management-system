import { useState, useEffect } from 'react';
import api from '../services/api';

const defaultForm = {
  patient_id: '',
  doctor_id: '',
  appointment_date: '',
  appointment_time: '',
  reason: '',
};

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
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

  const isPatient = user.role === 'patient';
  const canCreate = ['admin', 'nurse', 'patient'].includes(user.role);

  useEffect(() => {
    fetchAppointments();
    if (canCreate) {
      fetchPatients();
      fetchDoctors();
    }
  }, []);

  const fetchAppointments = async () => {
    try {
      const params = isPatient ? {} : {};
      const response = await api.get('/appointments', { params });
      setAppointments(response.data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      if (isPatient) {
        // Patient sees only their own record
        const patientResponse = await api.get('/patients');
        const patientData = patientResponse.data.find(p => p.user_id === user.id);
        if (patientData) {
          setPatients([patientData]);
          setForm(prev => ({ ...prev, patient_id: patientData.id }));
        } else {
          console.error('Patient record not found for user:', user.id);
        }
      } else {
        const response = await api.get('/patients');
        setPatients(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/staff', { params: { role: 'doctor' } });
      console.log('Doctors fetched:', response.data);
      setDoctors(response.data || []);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      setError('Failed to load doctors. Please refresh the page.');
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
      // Convert patient_id and doctor_id to numbers if they're strings
      const patientId = isPatient ? form.patient_id : Number(form.patient_id);
      const doctorId = Number(form.doctor_id);
      
      if (!patientId || !doctorId || !form.appointment_date || !form.appointment_time) {
        console.log('Validation failed:', { patientId, doctorId, date: form.appointment_date, time: form.appointment_time });
        setError('Please fill all required fields.');
        setSaving(false);
        return;
      }
      
      const appointmentData = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        reason: form.reason || null,
      };
      
      await api.post('/appointments', appointmentData);
      setSuccess('Appointment booked successfully.');
      
      // Reset form but keep patient_id for patients
      if (isPatient) {
        setForm({
          ...defaultForm,
          patient_id: patientId,
        });
      } else {
        setForm(defaultForm);
      }
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to book appointment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Appointments</h1>

      {canCreate && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Book Appointment</h2>
          {error && <div className="mb-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm p-3">{error}</div>}
          {success && <div className="mb-3 rounded bg-green-50 border border-green-200 text-green-700 text-sm p-3">{success}</div>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isPatient && (
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
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
              <select name="doctor_id" value={form.doctor_id || ''} onChange={handleChange} required className="w-full border rounded px-3 py-2">
                <option value="">Select doctor</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.first_name} {doc.last_name} {doc.specialization ? `- ${doc.specialization}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input name="appointment_date" type="date" value={form.appointment_date} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                <input name="appointment_time" type="time" value={form.appointment_time} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <textarea name="reason" value={form.reason} onChange={handleChange} className="w-full border rounded px-3 py-2" rows="3" />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Booking...' : 'Book Appointment'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Patient</th>
              <th className="p-4 text-left">Doctor</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Time</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt) => (
              <tr key={apt.id} className="border-b">
                <td className="p-4">{apt.patient_first_name} {apt.patient_last_name}</td>
                <td className="p-4">{apt.doctor_first_name} {apt.doctor_last_name}</td>
                <td className="p-4">{new Date(apt.appointment_date).toLocaleDateString()}</td>
                <td className="p-4">{apt.appointment_time}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {apt.status}
                  </span>
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500 text-sm" colSpan={5}>No appointments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Appointments;

