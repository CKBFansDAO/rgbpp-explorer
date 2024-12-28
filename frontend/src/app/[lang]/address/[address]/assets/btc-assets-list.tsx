'use client'

import { VStack } from 'styled-system/jsx'

import { CoinListUI } from '@/components/assets-list/coins-list'
import { ComingSoon } from '@/components/coming-soon'
import { Tabs } from '@/components/ui/tabs'
import { useAddressAsset } from '@/hooks/useRgbppData'

export function BtcAssetsList({ address }: { address: string }) {
     const coinList =  useAddressAsset(address)
   
      return (
        <>
          <VStack
            w="100%"
            bg="bg.card"
            rounded="8px"
            maxW="content"
            p={{ base: '20px', xl: '30px' }}
            gap={{ base: '20px', xl: '30px' }}
          >
            <Tabs.Root variant="line" defaultValue="Coins">
              <Tabs.List>
                <Tabs.Trigger value="Coins">Coins</Tabs.Trigger>
                <Tabs.Trigger value="Dobs">Dobs</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="Coins">
              <CoinListUI coinList={coinList?.assetInfo?.assets ?? []} />
              </Tabs.Content>
              <Tabs.Content value="Dobs">
                <ComingSoon />
              </Tabs.Content>
            </Tabs.Root>
          </VStack>
        </>
      )
    }
    