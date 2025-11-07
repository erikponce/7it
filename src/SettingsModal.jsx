import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, onSave, currentUrl }) => {
  const [url, setUrl] = useState(currentUrl);

  useEffect(() => {
    setUrl(currentUrl);
  }, [currentUrl]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    // Simple validation
    if (url.startsWith('http://') || url.startsWith('https://')) {
      onSave(url);
    } else {
      alert('Por favor, introduce una URL válida (ej. http://192.168.1.10:1880/plc-control)');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Configuración</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <div>
          <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 mb-2">
            URL de la API del PLC
          </label>
          <input
            type="text"
            id="apiUrl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://<IP-DEL-PLC>/api/jsonrpc"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Introduce la dirección del endpoint JSON-RPC (ej. de un PLC Siemens S7).
          </p>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center"
          >
            <Save size={18} className="mr-2" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
