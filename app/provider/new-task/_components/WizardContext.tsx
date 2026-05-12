'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type Framework = 'PyTorch' | 'TensorFlow' | 'JAX' | 'Other'
export type ModelType =
  | 'Image classification'
  | 'Object detection'
  | 'NLP / LLM'
  | 'Audio'
  | 'Tabular'
  | 'Other'

export interface WizardData {
  // Step 1
  name: string
  description: string
  modelType: ModelType | ''
  framework: Framework | ''
  gpuMin: string
  // Step 2
  encryptedFileKey: string | null   // AES key RSA-wrapped
  encryptedFileUrl: string | null   // first batch URL (compat)
  batchUrls: string[]               // all batch URLs in order
  fileName: string | null
  entryPoint: string
  requirementsFile: string
  // Step 3
  totalBatches: number
  pricePerBatch: number
  maxWorkers: number
  // Step 4
  walletAddress: string | null
}

interface WizardCtx {
  step: number
  setStep: (n: number) => void
  data: WizardData
  update: (patch: Partial<WizardData>) => void
}

const WizardContext = createContext<WizardCtx | null>(null)

const INITIAL: WizardData = {
  name: '',
  description: '',
  modelType: '',
  framework: '',
  gpuMin: 'Any GPU',
  encryptedFileKey: null,
  encryptedFileUrl: null,
  batchUrls: [],
  fileName: null,
  entryPoint: 'train.py',
  requirementsFile: 'requirements.txt',
  totalBatches: 5,
  pricePerBatch: 1.5,
  maxWorkers: 20,
  walletAddress: null,
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(INITIAL)
  const update = (patch: Partial<WizardData>) =>
    setData((prev) => ({ ...prev, ...patch }))

  return (
    <WizardContext.Provider value={{ step, setStep, data, update }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used inside WizardProvider')
  return ctx
}