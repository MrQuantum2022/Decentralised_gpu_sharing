'use client'

import { useWizard, ModelType, Framework } from './WizardContext'

const MODEL_TYPES: ModelType[] = [
  'Image classification',
  'Object detection',
  'NLP / LLM',
  'Audio',
  'Tabular',
  'Other',
]

const FRAMEWORKS: Framework[] = ['PyTorch', 'TensorFlow', 'JAX', 'Other']
const GPU_OPTIONS = ['Any GPU', 'RTX 3070', 'RTX 3080', 'RTX 4080', 'RTX 4090', 'A100']

export function Step1_TaskDetails() {
  const { data, update } = useWizard()

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-medium text-gray-900">Task details</h2>
        <p className="text-xs text-gray-500 mt-1">
          Describe your training job so workers know what they're contributing to.
        </p>
      </div>

      {/* Task name */}
      <div className="space-y-1.5">
        <label className="block text-xs text-gray-600">
          Task name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. ResNet-50 fine-tune — medical imaging"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-xs text-gray-600">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="What model, dataset, and goal?"
          rows={3}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Model type pills */}
      <div className="space-y-1.5">
        <label className="block text-xs text-gray-600">
          Model type <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {MODEL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => update({ modelType: t })}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                data.modelType === t
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-medium'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Framework + GPU row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs text-gray-600">
            Framework <span className="text-red-500">*</span>
          </label>
          <select
            value={data.framework}
            onChange={(e) => update({ framework: e.target.value as Framework })}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select framework</option>
            {FRAMEWORKS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs text-gray-600">Min GPU requirement</label>
          <select
            value={data.gpuMin}
            onChange={(e) => update({ gpuMin: e.target.value })}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {GPU_OPTIONS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}