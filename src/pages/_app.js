import '@/styles/globals.css'

import { WagmiConfig, createClient } from 'wagmi'
import { getDefaultClient, ConnectKitProvider } from "connectkit";
import {
  filecoinHyperspace,
  mainnet
} from "wagmi/chains";

const chains = [filecoinHyperspace, mainnet]
const client = createClient(
  getDefaultClient({
    appName: "Huddle01-Token-Gating",
    chains,
  })
)

export default function App ({ Component, pageProps }) {
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider>
        <Component {...pageProps} />
      </ConnectKitProvider>
    </WagmiConfig>
  )
}
