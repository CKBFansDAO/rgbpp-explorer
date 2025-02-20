'use client'

import { useState } from 'react'
import { Box, styled } from 'styled-system/jsx'

interface Props {
  symbol: string | null
  size?: {
    width?: string
    height?: string
    fontSize?: string
  }
}

export function XudtLogoLoader({ symbol, size }: Props) {
  const [loadFailed, setLoadFailed] = useState(false)

  const handleLoadError = () => {
    setLoadFailed(true)
  }

  const defaultSize = {
    width: '120px',
    height: '120px',
    fontSize: '48px'
  }

  const { width, height, fontSize } = size || defaultSize

  if (loadFailed || !symbol) {
    return (
      <Box
        w={width}
        h={height}
        rounded="full"
        bg="brand"
        color="white"
        fontWeight="bold"
        display="flex"
        alignItems="center"
        justifyContent="center"
        style={{ fontSize, flexShrink: 0 }}
      >
        {symbol?.charAt(0).toUpperCase()}
      </Box>
    )
  }

  return (
    <Box w={width} h={height}>
      <styled.img
        w="100%"
        h="100%"
        rounded="100%"
        src={`https://xudtlogos.cc/logos/${symbol}-logo.png`}
        alt={`${symbol}-logo`}
        onError={handleLoadError}
      />
    </Box>
  )
}
