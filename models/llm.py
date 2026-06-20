from pipecat.processors.frame_processor import FrameProcessor


class GroqProcessor(FrameProcessor):

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)

        if not hasattr(frame, "agent_response"):
            await self.push_frame(frame, direction)
            return

        # Pass the agent output through unchanged — each agent already calls the LLM
        # with its own prompt. Re-running without a system prompt reformats the output.
        frame.final_response = frame.agent_response

        await self.push_frame(frame, direction)
