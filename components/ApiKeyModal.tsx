import React, { useState } from 'react';
import { Key, AlertTriangle } from 'lucide-react';

interface Props {
  onSubmit: (key: string) => void;
}

const ApiKeyModal: React.FC<Props> = ({ onSubmit }) => {
  const [inputKey, setInputKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim().length > 10) {
      onSubmit(inputKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2C3E50]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] max-w-md w-full p-8 space-y-6">
        <div className="flex items-center space-x-3 text-[#E67E22]">
          <Key className="w-8 h-8" />
          <h2 className="text-2xl font-bold text-[#2C3E50]">Enter API Key</h2>
        </div>
        
        <div className="bg-[#E67E22]/10 border border-[#E67E22]/20 rounded-2xl p-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-[#E67E22] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#2C3E50]/80">
            This application requires a <strong>Google Maps API Key</strong> with Places, Geocoding, and Distance Matrix APIs enabled to function properly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#7F8C8D] mb-2">
              Google Maps API Key
            </label>
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-5 py-3 bg-white border border-[#ECF0F1] shadow-sm rounded-xl focus:ring-2 focus:ring-[#E67E22] focus:outline-none transition text-[#2C3E50]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={inputKey.length < 10}
            className="w-full bg-[#E67E22] hover:bg-[#D35400] disabled:bg-[#BDC3C7] disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition shadow-[0_4px_12px_rgba(230,126,34,0.2)] transform hover:scale-[1.01] active:scale-[0.99]"
          >
            Start Finding Restaurants
          </button>
        </form>
        <p className="text-xs text-[#BDC3C7] text-center">
          The key is only used in your browser session and is not stored externally.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyModal;