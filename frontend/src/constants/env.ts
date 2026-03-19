import { z } from 'zod'

const internalEnvSchema = z.object({})

const zodStringBoolean = z
  .string()
  .toLowerCase()
  .transform((x) => x === 'true')
  .pipe(z.boolean())

const publicEnvSchema = z.object({
  CKB_EXPLORER_URL: z.string().default('https://explorer.nervos.org'),
  MEMPOOL_URL: z.string().default('https://mempool.space'),
  IS_MAINNET: zodStringBoolean.default('true'),
  CKB_URL: z.string().default('https://nervos.org'),
  UTXO_STACK_URL: z.string().default('https://utxostack.network'),
  RGBPP_WHITE_PAPER_URL: z
    .string()
    .default('https://github.com/RGBPlusPlus/RGBPlusPlus-design/blob/main/docs/light-paper-en.md'),
  RGBPP_SCRIPT_URL: z
    .string()
    .default('https://github.com/RGBPlusPlus/RGBPlusPlus-design/blob/main/docs/lockscript-design-prd-en.md'),
  RGBPP_SDK_URL: z.string().default('https://github.com/ckb-devrel/ccc/tree/rgbpp-sdk/packages/rgbpp'),
  CKB_DEV_REL_TWITTER_URL: z.string().default('https://x.com/CKBDevrel'),
  RGBPP_ORG_GITHUB_URL: z.string().default('https://github.com/RGBPlusPlus'),
  NERVOS_NETWORK_MEDIUM_URL: z.string().default('https://medium.com/@nervosnetwork'),
  RGBPP_EXPLORER_TESTNET_URL: z.string().default('https://testnet.explorer.rgbpp.com'),
  RGBPP_EXPLORER_MAINNET_URL: z.string().default('https://explorer.rgbpp.com'),
  RGBPP_DOMAINS: z.string().default('explorer.rgbpp.com,testnet.explorer.rgbpp.com'),
})

const sharedEnvSchema = z.object({
  RGBPP_EXPLORER_API_URL: z.string().default('https://testnet-api.explorer.rgbpp.com/graphql'),
  GA_ID: z.string().optional(),
})

export const env = {
  share: sharedEnvSchema.parse({
    RGBPP_EXPLORER_API_URL: process.env.NEXT_PUBLIC_RGBPP_EXPLORER_API_URL,
    GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  }),
  internal: (typeof window === 'undefined' ? internalEnvSchema.parse(process.env) : {}) as z.infer<
    typeof internalEnvSchema
  >,
  public: publicEnvSchema.parse({
    CKB_EXPLORER_URL: process.env.NEXT_PUBLIC_CKB_EXPLORER_URL,
    MEMPOOL_URL: process.env.NEXT_PUBLIC_MEMPOOL_URL,
    IS_MAINNET: process.env.NEXT_PUBLIC_IS_MAINNET,
    CKB_URL: process.env.NEXT_PUBLIC_CKB_URL,
    UTXO_STACK_URL: process.env.NEXT_PUBLIC_UTXO_STACK_URL,
    RGBPP_WHITE_PAPER_URL: process.env.NEXT_PUBLIC_RGBPP_WHITE_PAPER_URL,
    RGBPP_SCRIPT_URL: process.env.NEXT_PUBLIC_RGBPP_SCRIPT_URL,
    RGBPP_SDK_URL: process.env.NEXT_PUBLIC_RGBPP_SDK_URL,
    RGBPP_DOMAINS: process.env.NEXT_PUBLIC_RGBPP_DOMAINS,
    RGBPP_EXPLORER_MAINNET_URL: process.env.NEXT_PUBLIC_RGBPP_EXPLORER_MAINNET_URL,
    RGBPP_EXPLORER_TESTNET_URL: process.env.NEXT_PUBLIC_RGBPP_EXPLORER_TESTNET_URL,
    CKB_CELL_GITHUB_URL: process.env.NEXT_PUBLIC_CKB_CELL_GITHUB_URL,
  }),
}