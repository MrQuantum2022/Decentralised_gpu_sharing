import { z } from 'zod'

export const step1Schema = z.object({
  name: z.string().min(3, 'Task name must be at least 3 characters'),
  modelType: z.string().min(1, 'Select a model type'),
  framework: z.string().min(1, 'Select a framework'),
})

export const step2Schema = z.object({
  encryptedFileUrl: z.string().min(1, 'Upload a dataset file'),
  entryPoint: z.string().min(1, 'Entry point is required'),
})

export const step3Schema = z.object({
  totalBatches: z.number().int().min(1).max(100_000),
  pricePerBatch: z.number().min(0.1),
  maxWorkers: z.number().int().min(1).max(1000),
})

export const step4Schema = z.object({
  walletAddress: z.string().min(32, 'Connect your Solana wallet'),
})

export type Step1Data = z.infer<typeof step1Schema>
export type Step3Data = z.infer<typeof step3Schema>