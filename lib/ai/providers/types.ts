export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIGenerateParams {
  systemPrompt: string
  userPrompt?: string
  messages?: AIMessage[]        // إن وُجدت، تُستخدم بدل userPrompt (محادثات متعددة الأدوار)
  maxTokens: number
  timeoutMs?: number
  jsonMode?: boolean            // يطلب إخراج JSON خالص — مُلزم فعلياً مع Gemini، توجيهي مع Claude
  temperature?: number
}

export interface AIProvider {
  readonly name: 'claude' | 'gemini'
  generate(params: AIGenerateParams): Promise<string>
  generateStream(params: AIGenerateParams): Promise<ReadableStream<Uint8Array>>
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly provider: string
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}