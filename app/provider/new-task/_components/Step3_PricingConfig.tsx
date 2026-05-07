'use client'

import { useWizard } from './WizardContext'

const PLATFORM_FEE = 0.05

export function Step3_PricingConfig() {
  const { data, update } = useWizard()

  const subtotal = data.totalBatches * data.pricePerBatch
  const fee = subtotal * PLATFORM_FEE
  const total = subtotal + fee

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-medium text-gray-900">Pricing &amp; batch configuration</h2>
        <p className="text-xs text-gray-500 mt-1">
          Set how the task is split and how much each worker earns per completed batch.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Total batches */}
        <div className="space-y-1.5">
          <label className="block text-xs text-gray-600">
            Total batches <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.totalBatches}
            min={1}
            max={100000}
            onChange={(e) =>
              update({ totalBatches: Math.max(1, parseInt(e.target.value) || 1) })
            }
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-gray-400">
            How many data partitions to split the dataset into
          </p>
        </div>

        {/* Price per batch */}
        <div className="space-y-1.5">
          <label className="block text-xs text-gray-600">
            Price per batch (USDC) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={data.pricePerBatch}
            min={0.1}
            step={0.1}
            onChange={(e) =>
              update({ pricePerBatch: Math.max(0.1, parseFloat(e.target.value) || 0.1) })
            }
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-gray-400">Paid to worker on batch completion</p>
        </div>
      </div>

      {/* Max workers slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs text-gray-600">Max concurrent workers</label>
          <span className="text-sm font-medium text-gray-900">{data.maxWorkers}</span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          step={1}
          value={data.maxWorkers}
          onChange={(e) => update({ maxWorkers: parseInt(e.target.value) })}
          className="w-full accent-emerald-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>1</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Batches</span>
          <span>{data.totalBatches.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Price per batch</span>
          <span>{data.pricePerBatch.toFixed(2)} USDC</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>{subtotal.toFixed(2)} USDC</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Platform fee (5%)</span>
          <span>{fee.toFixed(2)} USDC</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-medium text-gray-900">
          <span>Total escrow</span>
          <span className="text-emerald-700">{total.toFixed(2)} USDC</span>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Funds are locked in a Solana escrow account and released to workers per batch
        completion. Unclaimed batches are refunded if the task expires.
      </p>
    </div>
  )
}