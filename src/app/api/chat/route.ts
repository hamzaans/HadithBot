import { Configuration, OpenAIApi } from 'openai-edge'
import { Message, OpenAIStream, StreamingTextResponse } from 'ai'
import { getContext } from '@/utils/context'

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
  try {

    const { messages } = await req.json()

    // Get the last message
    const lastMessage = messages[messages.length - 1]

    // Get the context from the last message
    const context = await getContext(lastMessage.content, '')


    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const prompt = [
      {
        role: 'system',
        content: `AI assistant is a Muslim virtual scholar that only uses Sahih Bukhari to answer questions.
      START SAHIH BUKHARI CONTEXT BLOCK
      ${context}
      END SAHIH BUKHARI OF CONTEXT BLOCK
      AI assistant never answers blasphemously, and only answers from the Islamic perspective. 
      AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.`,
      },
    ]

    console.log({prompt})

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      stream: true,
      messages: [...prompt, ...messages.filter((message: Message) => message.role === 'user')]
    })
    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response)
    // Respond with the stream
    return new StreamingTextResponse(stream)
  } catch (e) {
    throw (e)
  }
}