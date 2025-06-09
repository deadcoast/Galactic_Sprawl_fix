**I. ResourceFlowManager Enhancements (`src/managers/resource/ResourceFlowManager.ts`)**

1.  **Expose Process/Chain Status Safely:**

    - **Problem:** The UI currently cannot display detailed, real-time status (paused, progress %) for individual processes or specific chain executions because the `processingQueue` and `chainExecutions` maps are private. The polling mechanism in the UI is inefficient and has limited information.
    - **Solution:**
      - Create a public method, e.g., `getProcessStatus(processId: string): { recipeId: string; progress: number; status: 'active' | 'paused' } | null;` to return minimal, safe status details for a single process.
      - Modify the existing `getChainExecutions()` to potentially return a filtered or summarized version if exposing the full status object is undesirable, or ensure the UI handles the existing map structure correctly.
    - **Rationale:** Allows the UI to get specific, necessary data without exposing internal implementation details or requiring inefficient workarounds.

2.  **Implement Event Publishing for State Changes:**

    - **Problem:** UI updates rely on polling. Manager actions like pause/resume/cancel/complete don't notify the UI.
    - **Solution:**
      - Define necessary event types (either new `EventType` enum members or agreed-upon string literals) for:
        - `PROCESS_PAUSED`, `PROCESS_RESUMED`, `PROCESS_CANCELLED`, `PROCESS_COMPLETED` (already exists as string literal)
        - `CHAIN_EXECUTION_STARTED`, `CHAIN_EXECUTION_PAUSED`, `CHAIN_EXECUTION_RESUMED`, `CHAIN_EXECUTION_CANCELLED`, `CHAIN_EXECUTION_COMPLETED`, `CHAIN_EXECUTION_FAILED`
      - Add `this.publish({...})` calls within the corresponding manager methods (`pauseConversionProcess`, `resumeConversionProcess`, `cancelConversionProcess`, `completeProcess`, `startConversionChain`, `pauseChainExecution`, `resumeChainExecution`, `cancelChainExecution`, `_processNextChainStep` for failures/completion). Ensure payloads contain necessary IDs (processId, executionId, chainId) and status updates.
    - **Rationale:** Enables a reactive UI that updates instantly based on manager state changes, eliminating inefficient polling.

3.  **Refine Cancellation Logic:**

    - **Problem:** `cancelConversionProcess` currently notes it doesn't automatically fail the associated chain step.
    - **Solution:** Modify `cancelConversionProcess` to find any associated active `ChainExecutionStatus` and update its step status to `FAILED`, potentially failing the entire chain execution if appropriate for the game logic.
    - **Rationale:** Ensures consistency and prevents chains from getting stuck if a critical step is cancelled.

4.  **Estimate Chain Completion Time:**
    - **Problem:** `estimatedEndTime` in `ChainExecutionStatus` is currently unused (set to 0).
    - **Solution:** Implement logic within `startConversionChain` to calculate an estimated end time by summing the `duration` of all recipes in the chain (potentially adjusted by known efficiency factors if desired).
    - **Rationale:** Provides useful predictive information for the UI/player.

**II. ConverterManagerUI Enhancements (`src/components/ui/resource/ConverterManagerUI.tsx`)**

1.  **Implement Event-Driven Updates:**

    - **Problem:** Currently uses `setInterval` for polling chain executions. Doesn't react to process state changes.
    - **Solution:**
      - Remove the `setInterval` in `useEffect`.
      - Add `useEffect` hooks to subscribe (`resourceFlowManager.subscribe(...)`) to the new events defined in Step I.2.
      - Update component state (`activeChainExecutions`, potentially add state for individual process statuses) based on received event data. Remember to return the unsubscribe function from `useEffect`.
    - **Rationale:** Creates a responsive, efficient UI that reflects manager state accurately.

2.  **Display Detailed Process/Chain Status:**

    - **Problem:** UI currently shows limited info (IDs, placeholder status/progress).
    - **Solution:**
      - Use the new `resourceFlowManager.getProcessStatus()` method (from Step I.1) or event data (from Step II.1) to get real-time progress and paused/active status for individual processes.
      - Update the rendering logic to display the fetched progress percentage and visually indicate paused states.
      - Enable/disable Pause/Resume buttons based on the actual process/chain status.
      - Display `chainStatus.errorMessage` if a chain execution fails.
    - **Rationale:** Provides users with clear feedback on conversion activities.

3.  **Replace Placeholder UI Components:**

    - **Problem:** Uses basic HTML elements with inline styles as placeholders.
    - **Solution:**
      - Identify appropriate components from the actual UI library (`/src/ui/components` or `/src/components/ui/common` based on project structure).
      - Replace `Button`, `Card`, `Select`, `Option` placeholders with the real components (e.g., `<UIButton>`, `<UICard>`).
      - Ensure props are passed correctly according to the real components' interfaces.
    - **Rationale:** Integrates the component visually and functionally with the established UI system.

4.  **Refine Chain Filtering:**

    - **Problem:** The current filter only checks if the _first_ recipe in a chain is supported by the converter.
    - **Solution:** Evaluate if this logic is sufficient. If a converter must support _all_ recipes in a chain, update the `.filter()` logic accordingly.
    - **Rationale:** Ensures users can only start chains that are actually possible on a given converter.

5.  **Improve Styling:**

    - **Problem:** Uses inline styles.
    - **Solution:** Apply CSS classes and styles consistent with the project's design system (e.g., Tailwind, CSS Modules).
    - **Rationale:** Ensures visual consistency and maintainability.

6.  **Enhance Error Handling:**
    - **Problem:** Uses basic `alert()` for user feedback on actions.
    - **Solution:** Integrate with a notification system (if available) or display errors more gracefully within the component UI instead of using `alert()`.
    - **Rationale:** Improves user experience.

**Summary Plan:**

1.  **Manager:** Add `getProcessStatus`, implement event publishing, refine cancellation, estimate chain time.
2.  **UI:** Replace polling with event subscriptions, display detailed status using new manager methods/event data, replace placeholder components, refine chain filter, apply proper styling, improve error feedback.
