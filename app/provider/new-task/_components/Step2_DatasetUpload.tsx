'use client'

import { useState, useCallback } from 'react'
import { useWizard } from './WizardContext'
import {
  generateKey,
  encryptFile,
  buildEncryptedBlob,
  exportRawKey,
  wrapKeyForBackend,
} from '@/lib/encrypt'
import { createClient } from '@/lib/supabase/client'

type UploadState = 'idle' | 'splitting' | 'encrypting' | 'uploading' | 'done' | 'error'

const BACKEND_PUBKEY = process.env.NEXT_PUBLIC_BACKEND_RSA_PUBKEY!

interface BatchProgress {
  index: number
  total: number
  stage: 'encrypting' | 'uploading' | 'done'
  percent: number
}

async function splitFileIntoChunks(file: File, totalBatches: number): Promise<Blob[]> {
  const buffer = await file.arrayBuffer()
  const chunkSize = Math.ceil(buffer.byteLength / totalBatches)
  const chunks: Blob[] = []
  for (let i = 0; i < totalBatches; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, buffer.byteLength)
    chunks.push(new Blob([buffer.slice(start, end)]))
  }
  return chunks
}

export function Step2_DatasetUpload() {
  const { data, update } = useWizard()
  const [uploadState, setUploadState] = useState<UploadState>(
    data.batchUrls && data.batchUrls.length > 0 ? 'done' : 'idle'
  )
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [overallPercent, setOverallPercent] = useState(0)

  const handleFile = useCallback(async (file: File) => {
    try {
      setError(null)
      const totalBatches = data.totalBatches || 5

      // 1. Split file into N chunks
      setUploadState('splitting')
      setOverallPercent(2)
      const chunks = await splitFileIntoChunks(file, totalBatches)

      // 2. Generate one AES key for all batches
      setUploadState('encrypting')
      const key = await generateKey()
      const rawKey = await exportRawKey(key)
      const wrappedKey = await wrapKeyForBackend(rawKey, BACKEND_PUBKEY)

      const supabase = createClient()
      const taskPrefix = `tasks/${Date.now()}`
      const batchUrls: string[] = []

      // 3. Encrypt and upload each batch sequentially
      for (let i = 0; i < chunks.length; i++) {
        const batchNum = i + 1

        // Encrypt
        setBatchProgress({ index: batchNum, total: chunks.length, stage: 'encrypting', percent: 0 })
        const chunkFile = new File([chunks[i]], `batch_${batchNum}`)
        const { iv, ciphertext } = await encryptFile(chunkFile, key)
        const blob = buildEncryptedBlob(iv, ciphertext)

        // Upload
        setBatchProgress({ index: batchNum, total: chunks.length, stage: 'uploading', percent: 50 })
        setUploadState('uploading')
        const filePath = `${taskPrefix}/batch_${batchNum}.enc`
        const { error: uploadError } = await supabase.storage
          .from('datasets')
          .upload(filePath, blob, { contentType: 'application/octet-stream' })

        if (uploadError) throw new Error(`Batch ${batchNum} upload failed: ${uploadError.message}`)

        const { data: urlData } = supabase.storage
          .from('datasets')
          .getPublicUrl(filePath)

        batchUrls.push(urlData.publicUrl)
        setBatchProgress({ index: batchNum, total: chunks.length, stage: 'done', percent: 100 })

        // Overall progress
        const overall = Math.round(((i + 1) / chunks.length) * 100)
        setOverallPercent(overall)
      }

      // 4. Store in wizard context
      update({
        batchUrls,
        encryptedFileKey: wrappedKey,
        fileName: file.name,
        encryptedFileUrl: batchUrls[0], // keep compat
      })
      setUploadState('done')
      setBatchProgress(null)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadState('error')
      setBatchProgress(null)
    }
  }, [data.totalBatches, update])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const isProcessing = uploadState === 'splitting' || uploadState === 'encrypting' || uploadState === 'uploading'

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-medium text-gray-900">Dataset upload</h2>
        <p className="text-xs text-gray-500 mt-1">
          Your dataset is split into {data.totalBatches} batches, encrypted individually, and uploaded sequentially.
          Raw data never leaves your machine unencrypted.
        </p>
      </div>

      {/* Security callout */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
        <span className="mt-0.5">🔒</span>
        <span>
          AES-256-GCM encryption runs entirely client-side. Each batch is encrypted with the same key,
          which is RSA-wrapped before leaving your browser.
        </span>
      </div>

      {/* Note about batch count */}
      {data.totalBatches > 0 && uploadState === 'idle' && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span>⚠</span>
          <span>Dataset will be split into <strong>{data.totalBatches} batches</strong>. Set batch count in Step 3 first if needed.</span>
        </div>
      )}

      {/* Drop zone */}
      <label
        className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isProcessing ? 'pointer-events-none opacity-80 border-blue-300 bg-blue-50' :
          uploadState === 'done' ? 'border-emerald-400 bg-emerald-50' :
          uploadState === 'error' ? 'border-red-300 bg-red-50' :
          'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
        }`}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input type="file" className="hidden" onChange={onInputChange} disabled={isProcessing} />

        {uploadState === 'idle' && (
          <>
            <div className="text-3xl mb-2">☁</div>
            <p className="text-sm text-gray-600">Drop dataset here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">Supported: .zip .tar.gz .hdf5 .csv — max 50 GB</p>
          </>
        )}

        {uploadState === 'splitting' && (
          <>
            <div className="text-2xl mb-2 animate-pulse">✂</div>
            <p className="text-sm font-medium text-gray-700">Splitting into {data.totalBatches} batches...</p>
            <p className="text-xs text-gray-400 mt-1">Processing in browser</p>
          </>
        )}

        {(uploadState === 'encrypting' || uploadState === 'uploading') && batchProgress && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              {batchProgress.stage === 'encrypting' ? '🔒 Encrypting' : '☁ Uploading'} batch {batchProgress.index} of {batchProgress.total}
            </p>

            {/* Per-batch progress */}
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${batchProgress.percent}%` }}
              />
            </div>

            {/* Overall progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Overall progress</span>
                <span>{overallPercent}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>

            {/* Batch indicators */}
            <div className="flex flex-wrap gap-1 justify-center mt-2">
              {Array.from({ length: batchProgress.total }, (_, i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded text-xs flex items-center justify-center font-mono ${
                    i + 1 < batchProgress.index ? 'bg-emerald-500 text-white' :
                    i + 1 === batchProgress.index ? 'bg-blue-500 text-white animate-pulse' :
                    'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i + 1 < batchProgress.index ? '✓' : i + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadState === 'done' && (
          <>
            <div className="text-3xl mb-2">✓</div>
            <p className="text-sm font-medium text-emerald-700">{data.fileName}</p>
            <p className="text-xs text-emerald-600 mt-1">{data.batchUrls?.length} batches uploaded</p>
            <div className="inline-flex items-center gap-1.5 mt-2 bg-white border border-emerald-300 rounded-md px-2.5 py-1 text-xs text-emerald-700">
              🔒 AES-256-GCM · {data.batchUrls?.length} encrypted batches
            </div>
          </>
        )}

        {uploadState === 'error' && (
          <>
            <p className="text-sm text-red-600 font-medium">Upload failed</p>
            <p className="text-xs text-red-400 mt-1">{error}</p>
            <p className="text-xs text-gray-400 mt-2">Click to retry</p>
          </>
        )}
      </label>

      {/* Script config */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs text-gray-600">
            Training script entry point <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.entryPoint}
            onChange={(e) => update({ entryPoint: e.target.value })}
            placeholder="train.py"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-gray-400">Workers run: python {data.entryPoint || 'train.py'} --batch-id N</p>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs text-gray-600">Requirements file</label>
          <input
            type="text"
            value={data.requirementsFile}
            onChange={(e) => update({ requirementsFile: e.target.value })}
            placeholder="requirements.txt"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-gray-400">pip install -r before each batch</p>
        </div>
      </div>
    </div>
  )
}