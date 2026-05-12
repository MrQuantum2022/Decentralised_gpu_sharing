import './globals.css'
import '@solana/wallet-adapter-react-ui/styles.css'  // add this
import { SolanaProviders } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SolanaProviders>{children}</SolanaProviders>
      </body>
    </html>
  )                                    
}