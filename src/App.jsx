import React, { useState, useEffect } from 'react';
import { Mic, Dice6, Hand, Send, Info, Cpu, Settings } from 'lucide-react';
import SettingsModal from './SettingsModal'; // Crearemos este componente a continuación

const App = () => {
  const [status, setStatus] = useState('Esperando activación...');
  const [isListening, setIsListening] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    const savedUrl = localStorage.getItem('apiUrl');
    if (savedUrl) {
      setApiUrl(savedUrl);
    } else {
      setIsSettingsOpen(true); // Abrir configuración si no hay URL guardada
    }
  }, []);

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('info');
    }, 4000);
  };

  const sendToPLC = async (value, source = 'Manual') => {
    if (!apiUrl) {
      showMessage('Error: La URL de la API del PLC no está configurada.', 'error');
      setIsSettingsOpen(true);
      return;
    }

    if (value < 1 || value > 5) {
      showMessage(`Error: El valor ${value} está fuera del rango permitido (1-5).`, 'error');
      return;
    }

    setStatus(`Enviando valor ${value} (Fuente: ${source}) al PLC...`);

    const jsonRpcPayload = {
      jsonrpc: '2.0',
      method: 'writeValue',
      params: { value, source },
      id: new Date().getTime(),
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonRpcPayload),
      });

      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.error) {
          showMessage(`❌ Error de API (${jsonResponse.error.code}): ${jsonResponse.error.message}`, 'error');
          setStatus('Error en la respuesta de la API del PLC.');
        } else {
          showMessage(`✅ Señal enviada con éxito: ${value}`, 'success');
          setStatus(`Última señal enviada: ${value} (Fuente: ${source})`);
        }
      } else {
        const errorText = await response.text();
        showMessage(`❌ Error de Conexión (${response.status}): ${errorText || 'Respuesta inesperada'}`, 'error');
        setStatus(`Error al enviar el valor ${value}. Revisa el servidor del PLC.`);
      }
    } catch (error) {
      showMessage(`⚠️ Error de conexión: No se pudo contactar a la API del PLC en ${apiUrl}. Revisa la IP/puerto.`, 'error');
      setStatus(`Error de conexión.`);
      console.error('Error de conexión con la API del PLC:', error);
    }
  };

  const startVoiceActivation = () => {
    if (!('webkitSpeechRecognition' in window)) {
      showMessage('⚠️ Tu navegador no soporta la activación por voz.', 'error');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setStatus('Escuchando... Di un número del 1 al 5.');

    recognition.start();

    recognition.onresult = (event) => {
      const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
      setIsListening(false);

      const numberMap = {
        'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
        '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
      };

      let valueToSend = null;
      for (const key in numberMap) {
        if (command.includes(key)) {
          valueToSend = numberMap[key];
          break;
        }
      }

      if (valueToSend) {
        showMessage(`Comando reconocido: "${command}". Enviando ${valueToSend}.`, 'info');
        sendToPLC(valueToSend, 'Voz');
      } else {
        showMessage(`No se reconoció un número válido (1-5) en: "${command}".`, 'error');
        setStatus('Escucha finalizada.');
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      showMessage(`Error de reconocimiento de voz: ${event.error}`, 'error');
      setStatus('Error al escuchar.');
    };

    recognition.onend = () => setIsListening(false);
  };

  const handleRandomActivation = () => {
    const randomValue = Math.floor(Math.random() * 5) + 1;
    sendToPLC(randomValue, 'Aleatorio');
  };

  const handleManualActivation = (value) => {
    sendToPLC(value, 'Manual');
  };

  const getMessageClasses = () => {
    switch (messageType) {
      case 'success': return 'bg-green-100 border-green-400 text-green-700';
      case 'error': return 'bg-red-100 border-red-400 text-red-700';
      default: return 'bg-blue-100 border-blue-400 text-blue-700';
    }
  };

  const Card = ({ children, title, icon: Icon, className = '' }) => (
    <div className={`flex flex-col items-center bg-white p-6 rounded-2xl shadow-xl transition transform hover:scale-[1.02] ${className}`}>
      <div className="p-3 bg-indigo-500 rounded-full text-white mb-4">
        <Icon size={32} />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans flex flex-col items-center justify-start pt-10">
      <div className="max-w-4xl w-full">
        <header className="mb-8 text-center relative">
          <h1 className="text-4xl font-extrabold text-indigo-700 flex items-center justify-center">
            <Cpu size={36} className="mr-3" /> Control Industrial (PWA)
          </h1>
          <p className="text-gray-600 mt-2">Interfaz de Activación para PLC Siemens</p>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="absolute top-0 right-0 p-2 text-gray-500 hover:text-indigo-700 transition"
            aria-label="Configuración"
          >
            <Settings size={24} />
          </button>
        </header>

        {message && (
          <div className={`mb-6 p-4 border-l-4 rounded-lg shadow-md ${getMessageClasses()} transition-all duration-300`}>
            <div className="flex items-center">
              <Info size={20} className="mr-3" />
              <p className="text-sm font-medium">{message}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="1. Activación por Voz" icon={Mic} className="bg-indigo-50">
            <p className="text-sm text-gray-600 mb-4 text-center">Di un número del uno al cinco.</p>
            <button
              onClick={startVoiceActivation}
              disabled={isListening}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all shadow-lg ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              } disabled:opacity-75 disabled:cursor-not-allowed`}
            >
              {isListening ? '🎙️ ESCUCHANDO...' : 'Activar Voz'}
            </button>
          </Card>

          <Card title="2. Activación Aleatoria" icon={Dice6} className="bg-green-50">
            <p className="text-sm text-gray-600 mb-4 text-center">Envía un valor aleatorio entre 1 y 5.</p>
            <button
              onClick={handleRandomActivation}
              className="w-full py-3 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-lg transition-all shadow-lg"
            >
              Enviar Valor Random
            </button>
          </Card>

          <Card title="3. Activación Manual" icon={Hand} className="bg-yellow-50">
            <p className="text-sm text-gray-700 mb-4 font-medium text-center">Selecciona el valor (1-5) a enviar:</p>
            <div className="grid grid-cols-5 gap-2 w-full">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => handleManualActivation(num)}
                  className="p-3 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-lg transition-all shadow-md focus:ring-4 focus:ring-yellow-300"
                >
                  {num}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-white rounded-xl shadow-inner border border-gray-200">
          <p className="text-sm font-semibold text-gray-700">Estado Actual del Control:</p>
          <p className="mt-1 text-lg text-gray-900">{status}</p>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(url) => {
          setApiUrl(url);
          localStorage.setItem('apiUrl', url);
          setIsSettingsOpen(false);
          showMessage('Configuración guardada con éxito.', 'success');
        }}
        currentUrl={apiUrl}
      />
    </div>
  );
};

export default App;
