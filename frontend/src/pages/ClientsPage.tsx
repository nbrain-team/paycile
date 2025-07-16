import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for now
  const clients = [
    { id: 1, name: 'John Smith', email: 'john.smith@email.com', phone: '555-123-4567', policies: 3, totalPremium: 5400 },
    { id: 2, name: 'Sarah Johnson', email: 'sarah.j@company.com', phone: '555-234-5678', policies: 2, totalPremium: 3200 },
    { id: 3, name: 'ABC Corp', email: 'contact@abccorp.com', phone: '555-345-6789', policies: 5, totalPremium: 12500 },
    { id: 4, name: 'Mike Williams', email: 'mike.w@email.com', phone: '555-456-7890', policies: 1, totalPremium: 1800 },
    { id: 5, name: 'Tech Solutions Inc', email: 'info@techsolutions.com', phone: '555-567-8901', policies: 4, totalPremium: 8900 },
  ];

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button className="btn-primary btn-md">
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Search clients..."
          className="input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{client.email}</p>
                <p className="text-sm text-gray-600">{client.phone}</p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-primary-600">
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Policies</p>
                <p className="font-semibold text-gray-900">{client.policies}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Premium</p>
                <p className="font-semibold text-gray-900">${client.totalPremium.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="mt-4 flex space-x-2">
              <button className="btn-outline btn-sm flex-1">View Details</button>
              <button className="btn-primary btn-sm flex-1">New Policy</button>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No clients found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}
