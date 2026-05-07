'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useEffect } from 'react'
import { useWizard } from './WizardContext'

const PLATFORM_FEE = 0.05

export function Step4_ReviewPublish() {
  const { data, update } = useWizard()
  const { publicKey, connected } = useWallet()

  // Sync wallet address into wizard context
  useEffect(() => {
    update({ walletAddress: publicKey?.toBase58() ?? null })
  }, [publicKey])

  const subtotal = data.totalBatches * data.pricePerBatch
  const total = subtotal * (1 + PLATFORM_FEE)

  const rows = [
    ['Task name', data.name],
    ['Model type', data.modelType],
    ['Framework', data.framework],
    ['Min GPU', data.gpuMin],
    ['Total batches', data.totalBatches.toLocaleString()],
    ['Price per batch', `${data.pricePerBatch.toFixed(2)} USDC`],
    ['Max workers', data.maxWorkers.toString()],
    ['Total escrow', `${total.toFixed(2)} USDC`],
    ['Dataset', data.fileName ?? '—'],
    ['Entry point', data.entryPoint],
    ['Encryption', 'AES-256-GCM (client-side)'],
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-medium text-gray-900">Review &amp; publish</h2>
        <p className="text-xs text-gray-500 mt-1">
          Confirm your task. Publishing locks{' '}
          <strong>{total.toFixed(2)} USDC</strong> in escrow on Solana.
        </p>
      </div>

      {/* Summary table */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        {rows.map(([label, value], i) => (
          <div
            key={label}
            className={`flex justify-between items-center px-4 py-2.5 text-sm ${
              i % 2 === 0 ? 'bg-gray-50' : 'bg-white'
            }`}
          >
            <span className="text-gray-500">{label}</span>
            <span className="text-gray-900 font-medium text-right max-w-[60%] truncate">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Wallet connection */}
      <div className="space-y-2">
        <label className="block text-xs text-gray-600">
          Solana wallet <span className="text-red-500">*</span>
        </label>
        {connected && publicKey ? (
          <div className="flex items-center justify-between border border-emerald-300 bg-emerald-50 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-600 text-lg">◎</span>
              <div>
                <p className="text-xs font-medium text-emerald-800">Wallet connected</p>
                <p className="text-xs text-emerald-600 font-mono">
                  {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-6)}
                </p>
              </div>
            </div>
            <span className="text-emerald-500">✓</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <WalletMultiButton className="!bg-gray-900 !text-white !text-sm !rounded-lg !px-4 !py-2.5 !font-medium hover:!bg-gray-800 !transition-colors" />
            <p className="text-xs text-gray-400">Phantom or Solflare supported</p>
          </div>
        )}
      </div>

      {!connected && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Connect your wallet to sign the transaction and publish this task.
        </p>
      )}
    </div>
  )
}