'use client'

import { useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  Upload, 
  FileX, 
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react'

interface UploadedXML {
  id: string
  fileName: string
  size: number
  status: 'pending' | 'processing' | 'success' | 'error'
  data?: {
    notaFiscal: string
    valor: number
    data: string
    tomador: string
  }
  error?: string
}

export default function DimobUploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedXML[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
  }

  const processFiles = async (files: File[]) => {
    setProcessing(true)
    
    const xmlFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.xml') || 
      file.type === 'text/xml' || 
      file.type === 'application/xml'
    )

    if (xmlFiles.length === 0) {
      alert('Por favor, selecione apenas arquivos XML de NFS-e')
      setProcessing(false)
      return
    }

    for (const file of xmlFiles) {
      const fileId = Date.now() + Math.random().toString()
      
      // Adiciona arquivo como pendente
      const newFile: UploadedXML = {
        id: fileId,
        fileName: file.name,
        size: file.size,
        status: 'pending'
      }
      
      setUploadedFiles(prev => [...prev, newFile])

      try {
        // Simula processamento do XML
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { ...f, status: 'processing' } : f)
        )

        // Lê o conteúdo do arquivo
        const content = await file.text()
        
        // Chama a API para processar o XML
        const response = await fetch('/api/dimob', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            xmlFiles: [{ fileName: file.name, content }],
            year: new Date().getFullYear(),
            generateFile: false
          })
        })

        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Erro ao processar XML')
        }

        const nfseData = result.data.nfseData[0]
        if (!nfseData) {
          throw new Error('Nenhum dado válido encontrado no XML')
        }

        const extractedData = {
          notaFiscal: nfseData.numeroNota,
          valor: nfseData.valorServicos,
          data: nfseData.dataEmissao,
          tomador: nfseData.tomador.razaoSocial
        }

        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { 
            ...f, 
            status: 'success',
            data: extractedData
          } : f)
        )

      } catch (error) {
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { 
            ...f, 
            status: 'error',
            error: 'Erro ao processar XML'
          } : f)
        )
      }
    }
    
    setProcessing(false)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upload de NFS-e</h1>
            <p className="text-gray-600">Importe os arquivos XML das suas notas fiscais de serviço</p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {dragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos XML ou clique para selecionar'}
            </h3>
            <p className="text-gray-600 mb-4">
              Suporta múltiplos arquivos XML de NFS-e
            </p>
            <input
              type="file"
              multiple
              accept=".xml,text/xml,application/xml"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivos
            </label>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Arquivos Carregados ({uploadedFiles.length})
              </h3>
              {processing && (
                <div className="text-sm text-blue-600">Processando...</div>
              )}
            </div>

            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{file.fileName}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {file.status === 'pending' && (
                        <div className="text-sm text-gray-500">Aguardando...</div>
                      )}
                      {file.status === 'processing' && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          Processando...
                        </div>
                      )}
                      {file.status === 'success' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Extracted Data */}
                  {file.status === 'success' && file.data && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Nota Fiscal</p>
                          <p className="font-medium">{file.data.notaFiscal}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Valor</p>
                          <p className="font-medium text-green-600">{formatCurrency(file.data.valor)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Data</p>
                          <p className="font-medium">{new Date(file.data.data).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Tomador</p>
                          <p className="font-medium">{file.data.tomador}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {file.status === 'error' && file.error && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-red-600">{file.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            {uploadedFiles.some(f => f.status === 'success') && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-900">
                        {uploadedFiles.filter(f => f.status === 'success').length} Processados
                      </span>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        Total: {formatCurrency(
                          uploadedFiles
                            .filter(f => f.status === 'success' && f.data)
                            .reduce((sum, f) => sum + (f.data?.valor || 0), 0)
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        Mês: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}