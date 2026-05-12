import { useState } from 'react'
import { WizardData } from '../app/provider/new-task/_components/WizardContext'

interface SubmitResult {
  taskId: string
  escrowTx: string
}

export function useTaskSubmit() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(data: WizardData): Promise<SubmitResult | null> {
    setLoading(true)
    setError(null)
    try {
      if (!data.batchUrls || data.batchUrls.length === 0) {
        throw new Error('No batches uploaded. Please complete the dataset upload step.')
      }
      if (!data.encryptedFileKey) {
        throw new Error('Encryption key missing. Please re-upload the dataset.')
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          model_type: data.modelType,
          framework: data.framework,
          gpu_min: data.gpuMin,
          batch_urls: data.batchUrls,
          encrypted_file_key: data.encryptedFileKey,
          entry_point: data.entryPoint,
          requirements_file: data.requirementsFile,
          total_batches: data.totalBatches,
          price_per_batch: data.pricePerBatch,
          max_workers: data.maxWorkers,
          provider_wallet: data.walletAddress,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.message ?? 'Task creation failed')
      }
      return await res.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { submit, loading, error }
}