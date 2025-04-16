import {
  ChatCompletionMessageParam,
  CreateMLCEngine,
  MLCEngine,
} from "@mlc-ai/web-llm";

class WebLLM {
  private engine: MLCEngine | null = null;

  public createConversation = (systemPrompt: string) => {
    const messages: Array<ChatCompletionMessageParam> = [
      { role: "system", content: systemPrompt },
    ];

    return {
      generate: async (prompt: string, temperature: number = 1) => {
        messages.push({ role: "user", content: prompt });
        if (!this.engine) {
          this.engine = await CreateMLCEngine("gemma-2-2b-it-q4f16_1-MLC", {
            initProgressCallback: console.log,
          });
        }

        await this.engine.chat.completions.create({
          messages,
          temperature,
        });
        const response = await this.engine.getMessage();

        messages.push({ role: "assistant", content: response });
        return response;
      },
    };
  };
}

export default WebLLM;
