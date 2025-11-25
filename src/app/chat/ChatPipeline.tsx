import { SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  AutoModelForCausalLM,
  AutoTokenizer,
  Message,
  PreTrainedModel,
  PreTrainedTokenizer,
  Tensor,
} from "@huggingface/transformers";
import { type FC, type ReactElement, useEffect, useRef, useState } from "react";

import usePageContext from "../../store/provider/pageContext/usePageContext.ts";
import { Loader } from "../../theme";
import cn from "../../utils/classnames.ts";
import mdToHtml from "../../utils/converter/mdToHtml.ts";
import { MODELS, SYSTEM_PROMPT } from "../../utils/llm/constants.ts";
import {
  WebMCPTool,
  webMCPToolToChatTemplateTool,
} from "../../utils/llm/webMcp.ts";
import ChatForm from "./ChatForm.tsx";

const Chat: FC = () => {
  const [chatOpen, setChatOpen] = useState<boolean>(false);

  const { pageContext } = usePageContext();

  const [thinking, setThinking] = useState<boolean>(false);
  const [response, setResponse] = useState<string>("");
  const [callbackElements, setCallbackElements] = useState<Array<ReactElement>>(
    []
  );
  const [conversation, setConversation] = useState<Array<Message>>([
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ]);

  const pipe = useRef<{
    tokenizer: PreTrainedTokenizer;
    model: PreTrainedModel;
  }>(null);

  useEffect(() => {
    return () => {
      pipe.current && pipe.current.model.dispose();
    };
  }, []);

  const onAskLLM = async (question: string): Promise<string> => {
    const { modelId, device, dtype } = MODELS.granite350m;

    const pageContextTool: WebMCPTool = {
      name: "get_page_context",
      description: "Get the current page context",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
      execute: async () =>
        `# Current Page: ${pageContext.title}\n\n${pageContext.content}`,
    };

    if (!pipe.current) {
      const [tokenizer, model] = await Promise.all([
        AutoTokenizer.from_pretrained(modelId, {
          progress_callback: console.log,
        }),
        AutoModelForCausalLM.from_pretrained(modelId, {
          dtype: dtype,
          device: device,
          progress_callback: console.log,
        }),
      ]);

      pipe.current = {
        tokenizer,
        model,
      };
    }

    const messages = conversation;

    messages.push({
      role: "user",
      content: question,
    });

    console.log("Messages", messages);

    console.log(
      "Input Chat Template:",
      pipe.current.tokenizer.apply_chat_template(messages, {
        tokenize: false,
      })
    );

    const input = pipe.current.tokenizer.apply_chat_template(messages, {
      tools: [webMCPToolToChatTemplateTool(pageContextTool)],
      add_generation_prompt: true, // start with <|start_of_role|>assistant<|end_of_role|> so the model can start from there
      return_dict: true, // also returns the input_ids with the dictionary with named outputs
    }) as {
      input_ids: Tensor;
      attention_mask: number[] | number[][] | Tensor;
    };

    console.log(input);

    const outputTokenIds = (await pipe.current.model.generate({
      ...input,
      // @ts-expect-error
      max_new_tokens: 512,
    })) as Tensor;

    console.log(outputTokenIds);

    const fullDecodedString = pipe.current.tokenizer.batch_decode(
      outputTokenIds,
      {
        skip_special_tokens: false,
      }
    )[0];

    console.log("Full Decoded String:", fullDecodedString);

    const lengthOfInput = input.input_ids.dims[1];
    const response = pipe.current.tokenizer.batch_decode(
      /**
       * First argument (null): Don't slice dimension 0 (the batch dimension) - keep all batches
       * Second argument ([lengthOfInput, Number.MAX_SAFE_INTEGER]): For dimension 1 (the sequence/token dimension), slice from index lengthOfInput to the end
       */
      outputTokenIds.slice(null, [lengthOfInput, Number.MAX_SAFE_INTEGER]),
      {
        skip_special_tokens: true, // removes the <|end_of_text|>
      }
    )[0];

    messages.push({
      role: "assistant",
      content: response,
    });

    setConversation(messages);

    return response;
  };

  return (
    <>
      <div
        className={cn(
          "fixed right-4 bottom-24 flex w-md origin-bottom-right flex-col gap-4 rounded-lg border border-purple-400 bg-purple-50 p-6 shadow-xl transition duration-300",
          {
            "translate-x-0 translate-y-16 scale-15 opacity-0": !chatOpen,
          }
        )}
      >
        <h3 className="flex items-center gap-2">
          <SparklesIcon aria-hidden="true" className="size-4" /> Ask the Agent
        </h3>
        <ChatForm
          chatOpen={chatOpen}
          onSubmit={async (prompt) => {
            if (!prompt) {
              setResponse("");
              setCallbackElements([]);
              return;
            }

            setThinking(true);
            const resp = await onAskLLM(prompt);
            setResponse(resp);
            setThinking(false);
          }}
        />
        {(response.length !== 0 || thinking) && (
          <div className="mt-4">
            {thinking ? (
              <p className="flex items-center gap-3 font-light text-gray-500 italic">
                <Loader size={4} /> thinking..
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {callbackElements.map((element) => element)}
                <div
                  className="font-light text-gray-700 [&>li]:ml-5 [&>ol]:my-2 [&>ol]:ml-4 [&>ol]:list-decimal [&>ul]:my-2 [&>ul]:ml-5 [&>ul]:list-disc"
                  dangerouslySetInnerHTML={{ __html: mdToHtml(response) }}
                />
              </div>
            )}
          </div>
        )}
      </div>
      <button
        onClick={() => setChatOpen((open) => !open)}
        className="fixed right-4 bottom-4 grid cursor-pointer rounded-full bg-purple-900 p-3 text-white outline-2 outline-offset-4 outline-purple-300 transition hover:outline-4 hover:outline-purple-900 focus:outline-4 focus:outline-purple-900"
      >
        <XMarkIcon
          aria-hidden="true"
          className={cn("col-start-1 row-start-1 size-8 transition", {
            "rotate-90 opacity-0": !chatOpen,
          })}
        />
        <SparklesIcon
          aria-hidden="true"
          className={cn("col-start-1 row-start-1 size-8 transition", {
            "-rotate-90 opacity-0": chatOpen,
          })}
        />
      </button>
    </>
  );
};

export default Chat;
