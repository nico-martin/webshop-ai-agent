import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const API_KEY = import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY;

const google = createGoogleGenerativeAI({
  apiKey: API_KEY,
});

class AiSdkAgent {
  public processPrompt = async (systemPrompt: string, userPrompt: string) => {
    const output = await generateObject({
      system: systemPrompt,
      model: google("models/gemini-2.0-flash-exp"),
      prompt: userPrompt,
      schema: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
        })
      ),
    });

    console.log(output.object);

    return output.object.map((film) => film.title).join(", ");
  };
}

export default AiSdkAgent;
