import { useState, useEffect } from 'react';
import api from '../services/api';

const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/medical-records');
      setRecords(response.data);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Medical Records</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Patient</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Diagnosis</th>
              <th className="p-4 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b">
                <td className="p-4">{record.patient_first_name} {record.patient_last_name}</td>
                <td className="p-4">{record.record_type}</td>
                <td className="p-4">{record.diagnosis}</td>
                <td className="p-4">{new Date(record.record_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MedicalRecords;




