'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { API_URL, BASIC_AUTH } from '@/lib/config';

interface ProcessedData {
  os_number: string;
  data: any;
  status: 'pending' | 'success' | 'error';
  idPaxIntegrador: number;
}

interface LocationConfig {
  transferIn: {
    pickup: number | null;
    dropoff: number | null;
  };
  transferOut: {
    pickup: number | null;
    dropoff: number | null;
  };
  idHotelPousada: string;
  idEvento: string;
  idGrupo: string;
  idCanalServicoFile: string;
  idCliente: string;
}

export default function DashboardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState({
    transferInPickup: '',
    transferInDropoff: '',
    transferOutPickup: '',
    transferOutDropoff: '',
    rowsToLoad: '',
    idHotelPousada: '',
    idEvento: '',
    idGrupo: '',
    idCanalServicoFile: '',
    idCliente: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData[]>([]);
  const [selectedOS, setSelectedOS] = useState<string | null>(null);
  const [jsonPreview, setJsonPreview] = useState<any>(null);
  const [locationConfig, setLocationConfig] = useState<LocationConfig>({
    transferIn: { pickup: null, dropoff: null },
    transferOut: { pickup: null, dropoff: null },
    idHotelPousada: '',
    idEvento: '',
    idGrupo: '',
    idCanalServicoFile: '',
    idCliente: ''
  });
  const router = useRouter();

  const steps = [
    { id: 1, name: 'Configuração', description: 'Configure os IDs e quantidade de linhas' },
    { id: 2, name: 'Upload e Processamento', description: 'Faça upload e processe o arquivo' }
  ];

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return config.transferInPickup && config.transferInDropoff && 
               config.transferOutPickup && config.transferOutDropoff &&
               config.rowsToLoad !== '';
      case 2:
        return file !== null;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length && isStepComplete(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getBasicAuthHeaders = () => ({
    'Authorization': `Basic ${btoa(`${BASIC_AUTH.username}:${BASIC_AUTH.password}`)}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Enviando configuração:', {
        transferInPickup: locationConfig.transferIn.pickup,
        transferInDropoff: locationConfig.transferIn.dropoff,
        transferOutPickup: locationConfig.transferOut.pickup,
        transferOutDropoff: locationConfig.transferOut.dropoff,
        idHotelPousada: locationConfig.idHotelPousada,
        idEvento: locationConfig.idEvento,
        idGrupo: locationConfig.idGrupo,
        idCanalServicoFile: locationConfig.idCanalServicoFile,
        idCliente: locationConfig.idCliente
      });

      // Enviar configuração para o servidor
      const response = await fetch('http://localhost:3001/api/update-location-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          transferInPickup: locationConfig.transferIn.pickup,
          transferInDropoff: locationConfig.transferIn.dropoff,
          transferOutPickup: locationConfig.transferOut.pickup,
          transferOutDropoff: locationConfig.transferOut.dropoff,
          idHotelPousada: locationConfig.idHotelPousada,
          idEvento: locationConfig.idEvento,
          idGrupo: locationConfig.idGrupo,
          idCanalServicoFile: locationConfig.idCanalServicoFile,
          idCliente: locationConfig.idCliente
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar configuração');
      }

      const updatedConfig = await response.json();
      console.log('Configuração atualizada:', updatedConfig);

      alert('Configuração salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração. Por favor, tente novamente.');
    }
  };

  // Carregar configuração ao montar o componente
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/location-config', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });

        if (response.ok) {
          const config = await response.json();
          console.log('Configuração carregada:', config);
          setLocationConfig(config);
        }
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      }
    };

    loadConfig();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      // First, save the configuration
      const configResponse = await fetch('http://localhost:3001/api/update-location-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          transferInPickup: config.transferInPickup,
          transferInDropoff: config.transferInDropoff,
          transferOutPickup: config.transferOutPickup,
          transferOutDropoff: config.transferOutDropoff,
          rowsToLoad: config.rowsToLoad,
          idHotelPousada: config.idHotelPousada,
          idEvento: config.idEvento,
          idGrupo: config.idGrupo,
          idCanalServicoFile: config.idCanalServicoFile,
          idCliente: config.idCliente
        })
      });

      if (!configResponse.ok) {
        throw new Error('Falha ao salvar configuração');
      }

      // Then, upload the file
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Falha ao fazer upload do arquivo');
      }

      const { data, skipped } = await uploadResponse.json();
      
      // Inicializa todos os itens como pending sem tentar enviar
      const processedItems = data.map((item: any) => ({
        ...item,
        status: 'pending'
      }));
      
      setProcessedData(processedItems);
      setSuccess(true);

      // Melhorar a mensagem de feedback
      const totalRows = data.length + (skipped?.length || 0);
      const processedRows = data.length;
      
      if (skipped && skipped.length > 0) {
        setError(
          `Arquivo processado: ${processedRows} de ${totalRows} linhas.` +
          (config.rowsToLoad ? ` (Limite configurado: ${config.rowsToLoad} linhas)` : '') +
          `\nOSs não processadas: ${skipped.join(', ')}`
        );
      } else {
        setSuccess(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar arquivo';
      setError(errorMessage);
      if (errorMessage.includes('Sessão expirada')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    if (!date) return null;
    
    try {
      // Se já for uma string no formato dd/mm/yyyy, retorna como está
      if (typeof date === 'string' && date.includes('/')) {
        return date;
      }

      // Se for um objeto Date, converte para o formato dd/mm/yyyy
      if (date instanceof Date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }

      // Se for uma string ISO, converte para o formato dd/mm/yyyy
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        console.error('Data inválida:', date);
        return null;
      }
      
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return null;
    }
  };

  const handleSendOS = async (os_number: string, data: any, idPaxIntegrador: number) => {
    try {
      console.log('Dados originais:', {
        dataInicioServicos: data.dataInicioServicos,
        dataFimServicos: data.dataFimServicos,
        paxsFile: data.paxsFile,
        servicosFile: data.servicosFile
      });

      // Format dates in the payload
      const formattedData = {
        ...data,
        dataInicioServicos: formatDate(data.dataInicioServicos),
        dataFimServicos: formatDate(data.dataFimServicos),
        paxsFile: data.paxsFile.map((pax: any) => {
          console.log('Formatando data de nascimento:', pax.dataNascimento);
          return {
            ...pax,
            dataNascimento: formatDate(pax.dataNascimento)
          };
        }),
        servicosFile: data.servicosFile.map((servico: any) => {
          console.log('Formatando datas do serviço:', {
            dataInicioServico: servico.dataInicioServico,
            dataFimServico: servico.dataFimServico
          });
          return {
            ...servico,
            dataInicioServico: formatDate(servico.dataInicioServico),
            dataFimServico: formatDate(servico.dataFimServico),
            idLocalPickUp: servico.idServicoReceptivo === 17 
              ? parseInt(config.transferInPickup)
              : parseInt(config.transferOutPickup),
            idLocalDropOff: servico.idServicoReceptivo === 17
              ? parseInt(config.transferInDropoff)
              : parseInt(config.transferOutDropoff)
          };
        })
      };

      console.log('Dados formatados:', formattedData);

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      const response = await fetch('http://localhost:3001/api/send-os', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          os_number,
          data: formattedData,
          idPaxIntegrador
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao enviar OS');
      }

      const responseData = await response.json();
      
      if (responseData.status === 'success') {
        setProcessedData(prev => 
          prev.map(item => 
            item.os_number === os_number 
              ? { ...item, status: 'success' }
              : item
          )
        );
      } else {
        throw new Error(responseData.message || 'Falha ao enviar OS');
      }
    } catch (error: any) {
      console.error('Erro ao enviar OS:', error);
      setProcessedData(prev => 
        prev.map(item => 
          item.os_number === os_number 
            ? { ...item, status: 'error' }
            : item
        )
      );
      throw error;
    }
  };

  const handleSendAll = async () => {
    for (const item of processedData) {
      if (item.status === 'pending') {
        await handleSendOS(item.os_number, item.data, item.idPaxIntegrador);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Logout and History */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Importação de Arquivo Excel</h1>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/history')}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Ver Histórico
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <nav aria-label="Progress">
          <ol className="flex items-center justify-center">
            {steps.map((step, index) => (
              <li key={step.id} className={`relative ${index !== steps.length - 1 ? 'flex-1' : ''}`}>
                <div className="group flex items-center">
                  <span className="flex items-center" aria-current={currentStep === step.id ? "step" : undefined}>
                    <span className={`w-10 h-10 flex items-center justify-center rounded-full ${
                      currentStep > step.id 
                        ? 'bg-indigo-600' 
                        : currentStep === step.id 
                          ? 'bg-indigo-600 ring-4 ring-indigo-600 ring-opacity-50' 
                          : 'bg-gray-300'
                    }`}>
                      <span className={`text-sm font-medium ${
                        currentStep >= step.id ? 'text-white' : 'text-gray-500'
                      }`}>
                        {step.id}
                      </span>
                    </span>
                    <span className="ml-4 text-sm font-medium text-gray-900">{step.name}</span>
                  </span>
                  {index !== steps.length - 1 && (
                    <div className={`absolute top-5 w-full h-0.5 -translate-y-1/2 ${
                      currentStep > step.id ? 'bg-indigo-600' : 'bg-gray-300'
                    }`} style={{ left: '25%', width: 'calc(80% - 2rem)' }} />
                  )}
                </div>
                <div className="mt-2">
                  <span className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {step.description}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </nav>

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === 1 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Configuração</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transfer IN - Local de Pickup</label>
                  <input
                    type="text"
                    value={config.transferInPickup}
                    onChange={(e) => setConfig({ ...config, transferInPickup: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transfer IN - Local de Dropoff</label>
                  <input
                    type="text"
                    value={config.transferInDropoff}
                    onChange={(e) => setConfig({ ...config, transferInDropoff: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transfer OUT - Local de Pickup</label>
                  <input
                    type="text"
                    value={config.transferOutPickup}
                    onChange={(e) => setConfig({ ...config, transferOutPickup: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transfer OUT - Local de Dropoff</label>
                  <input
                    type="text"
                    value={config.transferOutDropoff}
                    onChange={(e) => setConfig({ ...config, transferOutDropoff: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Hotel/Pousada</label>
                  <input
                    type="number"
                    value={config.idHotelPousada}
                    onChange={(e) => setConfig({ ...config, idHotelPousada: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Ex: 14"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Evento</label>
                  <input
                    type="number"
                    value={config.idEvento}
                    onChange={(e) => setConfig({ ...config, idEvento: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Ex: 0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Grupo</label>
                  <input
                    type="number"
                    value={config.idGrupo}
                    onChange={(e) => setConfig({ ...config, idGrupo: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Ex: 0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Canal Serviço File</label>
                  <input
                    type="number"
                    value={config.idCanalServicoFile}
                    onChange={(e) => setConfig({ ...config, idCanalServicoFile: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Ex: 4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Cliente</label>
                  <input
                    type="text"
                    value={config.idCliente}
                    onChange={(e) => setConfig({ ...config, idCliente: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Ex: 11189127000117"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Número de Linhas para Carregar</label>
                  <div className="mt-1">
                    <input
                      type="number"
                      value={config.rowsToLoad}
                      onChange={(e) => setConfig({ ...config, rowsToLoad: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Deixe em branco para carregar todas as linhas"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Defina quantas linhas do arquivo Excel você deseja carregar. Deixe em branco para carregar todas as linhas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Upload e Processamento</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Selecione o arquivo Excel</label>
                  <div className="mt-1">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100"
                    />
                  </div>
                  {file && (
                    <p className="mt-2 text-sm text-gray-500">
                      Arquivo selecionado: {file.name}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="rounded-md bg-green-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">Arquivo processado com sucesso!</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <button
                    onClick={handleUpload}
                    disabled={loading || !file}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      (loading || !file) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processando...
                      </div>
                    ) : 'Processar Arquivo'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Anterior
            </button>
            {currentStep < steps.length ? (
              <button
                onClick={handleNextStep}
                disabled={!isStepComplete(currentStep)}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  !isStepComplete(currentStep) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Próximo
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {processedData.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Dados Processados</h3>
            <button
              onClick={handleSendAll}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Enviar Todos
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    OS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Pax Integrador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.map((item) => (
                  <tr key={item.os_number}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.os_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.idPaxIntegrador}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${item.status === 'success' 
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {item.status === 'success' ? 'Sucesso' : 
                         item.status === 'error' ? 'Erro' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOS(item.os_number);
                            setJsonPreview(item.data);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Ver JSON
                        </button>
                        {item.status !== 'success' && (
                          <button
                            onClick={() => handleSendOS(item.os_number, item.data, item.idPaxIntegrador)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Enviar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {jsonPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">JSON da OS {selectedOS}</h3>
              <button
                onClick={() => {
                  setSelectedOS(null);
                  setJsonPreview(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Fechar
              </button>
            </div>
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto">
              {JSON.stringify(jsonPreview, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 