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

type UploadState = 'idle' | 'encrypting' | 'uploading' | 'done' | 'error'

// Fetch from env — never hardcode
const BACKEND_PUBKEY = process.env.NEXT_PUBLIC_BACKEND_RSA_PUBKEY!

export function Step2_DatasetUpload() {
  const { data, update } = useWizard()
  const [uploadState, setUploadState] = useState<UploadState>(
    data.encryptedFileUrl ? 'done' : 'idle'
  )
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    try {
      setError(null)
      setUploadState('encrypting')
      setProgress(10)

      // 1. Generate AES-256-GCM key in browser
      const key = await generateKey()
      setProgress(25)

      // 2. Encrypt the file client-side
      const { iv, ciphertext } = await encryptFile(file, key)
      setProgress(50)

      // 3. Build encrypted blob (IV prepended)
      const blob = buildEncryptedBlob(iv, ciphertext)
      setProgress(60)

      // 4. Wrap key with backend RSA pubkey for safe storage
      const rawKey = await exportRawKey(key)
      const wrappedKey = await wrapKeyForBackend(rawKey, BACKEND_PUBKEY)
      setProgress(70)

      // 5. Upload encrypted blob to Supabase storage
      setUploadState('uploading')
      const supabase = createClient()
      const filePath = `tasks/${Date.now()}_${file.name}.enc`
      const { error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(filePath, blob, { contentType: 'application/octet-stream' })

      if (uploadError) throw new Error(uploadError.message)
      setProgress(100)

      const { data: urlData } = supabase.storage
        .from('datasets')
        .getPublicUrl(filePath)

      // 6. Store URL + wrapped key in wizard context
      update({
        encryptedFileUrl: urlData.publicUrl,
        encryptedFileKey: wrappedKey,
        fileName: file.name,
      })
      setUploadState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploadState('error')
    }
  }, [update])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-medium text-gray-900">Dataset upload</h2>
        <p className="text-xs text-gray-500 mt-1">
          Your dataset is encrypted in your browser before upload. The raw file never leaves
          your machine unencrypted.
        </p>
      </div>

      {/* Security callout */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
        <span className="mt-0.5">🔒</span>
        <span>
          AES-256-GCM encryption runs entirely client-side via the Web Crypto API. The key is
          wrapped with the backend RSA public key before any data touches the network.
        </span>
      </div>

      {/* Drop zone */}
      <label
        className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          uploadState === 'done'
            ? 'border-emerald-400 bg-emerald-50'
            : uploadState === 'error'
            ? 'border-red-300 bg-red-50'
            : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
        }`}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input type="file" className="hidden" onChange={onInputChange} />

        {uploadState === 'idle' && (
          <>
            <div className="text-3xl mb-2">☁</div>
            <p className="text-sm text-gray-600">Drop dataset here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">
              Supported: .zip .tar.gz .hdf5 .csv — max 50 GB
            </p>
          </>
        )}

        {(uploadState === 'encrypting' || uploadState === 'uploading') && (
          <>
            <div className="text-sm font-medium text-gray-700 mb-2">
              {uploadState === 'encrypting' ? 'Encrypting...' : 'Uploading encrypted blob...'}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">AES-256-GCM · {progress}%</p>
          </>
        )}

        {uploadState === 'done' && (
          <>
            <div className="text-3xl mb-2">✓</div>
            <p className="text-sm font-medium text-emerald-700">{data.fileName}</p>
            <div className="inline-flex items-center gap-1.5 mt-2 bg-white border border-emerald-300 rounded-md px-2.5 py-1 text-xs text-emerald-700">
              🔒 AES-256-GCM encrypted
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
          <p className="text-xs text-gray-400">
            Workers run: python {data.entryPoint || 'train.py'} --batch-id N
          </p>
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