'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WizardProvider, useWizard } from './_components/WizardContext'
import { Step1_TaskDetails } from './_components/Step1_TaskDetails'
import { Step2_DatasetUpload } from './_components/Step2_DatasetUpload'
import { Step3_PricingConfig } from './_components/Step3_PricingConfig'
import { Step4_ReviewPublish } from './_components/Step4_ReviewPublish'
import { step1Schema, step2Schema, step3Schema, step4Schema } from '@/lib/formSchema'
import { useTaskSubmit } from '@/lib/useTaskSubmit'

const STEPS = ['Task details', 'Pricing', 'Dataset upload', 'Review']

function WizardInner() {
  const router = useRouter()
  const { step, setStep, data } = useWizard()
  const { connected } = useWallet()
  const { submit, loading, error } = useTaskSubmit()
  const [validationError, setValidationError] = useState<string | null>(null)
  const [published, setPublished] = useState<{ taskId: string; escrowTx: string } | null>(null)

  function validate(): boolean {
    setValidationError(null)
    try {
      if (step === 0) step1Schema.parse(data)
      if (step === 1) step3Schema.parse(data)
      if (step === 2) step2Schema.parse(data)
      if (step === 3) step4Schema.parse(data)
      return true
    } catch (e: any) {
      setValidationError(e.errors?.[0]?.message ?? 'Please complete all required fields')
      return false
    }
  }

  async function handleNext() {
    if (!validate()) return
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      // Publish
      const result = await submit(data)
      if (result) setPublished(result)
    }
  }

  const isLastStep = step === STEPS.length - 1
  const canPublish = isLastStep && connected

  if (published) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5 text-emerald-500 text-2xl">
          ✓
        </div>
        <h1 className="text-xl font-medium text-gray-900 mb-2">Task published</h1>
        <p className="text-sm text-gray-500 mb-8">
          Your task is live on the GPULEND network. Workers can now register and start
          training.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm mb-8">
          <div className="flex justify-between">
            <span className="text-gray-500">Task ID</span>
            <span className="font-mono text-gray-900">{published.taskId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Escrow tx</span>
            <a
              href={`https://explorer.solana.com/tx/${published.escrowTx}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-emerald-600 hover:underline truncate max-w-[180px]"
            >
              {published.escrowTx.slice(0, 12)}...
            </a>
          </div>
        </div>
        <button
          onClick={() => router.push(`/provider/tasks/${published.taskId}`)}
          className="w-full bg-gray-900 text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          View task dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 h-13 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium tracking-tight">GPULEND.IO</span>
        </div>
        <button
          onClick={() => router.push('/community')}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          ← Back to marketplace
        </button>
      </header>

      <main className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-lg font-medium text-gray-900 mb-1">Create training task</h1>
        <p className="text-xs text-gray-500 mb-8">
          Your dataset is encrypted client-side and distributed in batches across the GPU
          network.
        </p>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 border transition-all ${
                  i < step
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                    : i === step
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span
                className={`ml-2 text-xs ${
                  i === step ? 'text-emerald-700 font-medium' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-3 ${
                    i < step ? 'bg-emerald-300' : 'bg-gray-100'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
          {step === 0 && <Step1_TaskDetails />}
          {step === 1 && <Step3_PricingConfig />}
          {step === 2 && <Step2_DatasetUpload />}
          {step === 3 && <Step4_ReviewPublish />}
        </div>

        {/* Validation error */}
        {(validationError || error) && (
          <p className="text-xs text-red-500 mb-3 px-1">{validationError ?? error}</p>
        )}

        {/* Nav */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg disabled:opacity-0 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={loading || (isLastStep && !canPublish)}
            className="px-6 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg disabled:opacity-40 hover:bg-gray-800 transition-colors"
          >
            {loading
              ? 'Publishing...'
              : isLastStep
              ? connected
                ? 'Publish task'
                : 'Connect wallet to publish'
              : 'Continue'}
          </button>
        </div>
      </main>
    </div>
  )
}

export default function NewTaskPage() {
  return (
    <WizardProvider>
      <WizardInner />
    </WizardProvider>
  )
}