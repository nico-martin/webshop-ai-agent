import { SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import React from "react";

import WebLLM from "../../ai/llm/WebLLM.ts";
import usePageContext from "../../store/provider/pageContext/usePageContext.ts";
import { Loader } from "../../theme";
import cn from "../../utils/classnames.ts";
import mdToHtml from "../../utils/converter/mdToHtml.ts";
import ChatForm from "./ChatForm.tsx";

const Chat: React.FC = () => {
  const [chatOpen, setChatOpen] = React.useState<boolean>(false);

  const { pageContext } = usePageContext();

  const [thinking, setThinking] = React.useState<boolean>(false);
  const [response, setResponse] = React.useState<string>("");

  const llm = React.useMemo(() => new WebLLM(), []);

  return (
    <React.Fragment>
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
              return;
            }
            const systemPrompt = `You are a helpful AI ecommerce assistant
You help the user navigate through the website, find products, and answer questions about products and services.
Do not just make something up. Do not hallucinate.

# Current Page: ${pageContext.title}
${pageContext.content}`;

            console.log(systemPrompt);

            const conversation = llm.createConversation(systemPrompt);

            setThinking(true);
            const resp = await conversation.generate(prompt);
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
              <div dangerouslySetInnerHTML={{ __html: mdToHtml(response) }} />
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
    </React.Fragment>
  );
};

export default Chat;
