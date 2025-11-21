# 1. SimpleChat
- create the pipeline in onAskLLM with system prompt
- add the pipeline to a useRef
- add page context

Problem: "Whats the price?" --> answer. "What about two?" --> no context

# 2. Conversation
- create the messages state
- "Whats the price?" --> answer. "What about two?" --> will be double

Problem: go to different product: "whats the price of the socks?" -> will talk about the previous product
Two solutions: reset the messages on page context change -> go agentic

# 3. Agent
- split the pipline in tokenizer and model (ChatPipeline.tsx)