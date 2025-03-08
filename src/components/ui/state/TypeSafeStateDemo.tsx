/**
 * Type-Safe State Demo
 *
 * This component demonstrates the use of the type-safe state management utilities
 * with an emphasis on properly typed reducers and safe state transitions.
 */

import React, { useEffect, useState } from 'react';
import {
  Action,
  createAction,
  createAsyncReducer,
  createReducer,
  createSimpleAction,
  PayloadAction,
  useTypedReducer,
  useTypedTransitions,
} from '../../../types/state/TypeSafeStateManagement';

// Define our state shape with proper typing
interface CounterState {
  count: number;
  lastOperation: string;
  history: Array<{
    operation: string;
    previousValue: number;
    newValue: number;
    timestamp: number;
  }>;
}

// Define action types with string constants
const INCREMENT = 'counter/increment';
const DECREMENT = 'counter/decrement';
const ADD = 'counter/add';
const RESET = 'counter/reset';
const SET_COUNT = 'counter/setCount';
const UNDO = 'counter/undo';

// Define strongly typed action creators
const increment = createSimpleAction(INCREMENT);
const decrement = createSimpleAction(DECREMENT);
const add = createAction<typeof ADD, number>(ADD);
const reset = createSimpleAction(RESET);
const setCount = createAction<typeof SET_COUNT, number>(SET_COUNT);
const undo = createSimpleAction(UNDO);

// Create a union type of all possible actions
type CounterAction =
  | Action<typeof INCREMENT>
  | Action<typeof DECREMENT>
  | PayloadAction<typeof ADD, number>
  | Action<typeof RESET>
  | PayloadAction<typeof SET_COUNT, number>
  | Action<typeof UNDO>;

// Initial state
const initialState: CounterState = {
  count: 0,
  lastOperation: 'Initial state',
  history: [],
};

// Create a reducer using the builder pattern for type safety
const counterReducer = createReducer<CounterState, CounterAction>(initialState)
  .addCase(INCREMENT, state => {
    const newValue = state.count + 1;
    return {
      ...state,
      count: newValue,
      lastOperation: 'Incremented',
      history: [
        ...state.history,
        {
          operation: 'Increment',
          previousValue: state.count,
          newValue,
          timestamp: Date.now(),
        },
      ],
    };
  })
  .addCase(DECREMENT, state => {
    const newValue = state.count - 1;
    return {
      ...state,
      count: newValue,
      lastOperation: 'Decremented',
      history: [
        ...state.history,
        {
          operation: 'Decrement',
          previousValue: state.count,
          newValue,
          timestamp: Date.now(),
        },
      ],
    };
  })
  .addCase(ADD, (state, action) => {
    const newValue = state.count + action.payload;
    return {
      ...state,
      count: newValue,
      lastOperation: `Added ${action.payload}`,
      history: [
        ...state.history,
        {
          operation: `Add ${action.payload}`,
          previousValue: state.count,
          newValue,
          timestamp: Date.now(),
        },
      ],
    };
  })
  .addCase(SET_COUNT, (state, action) => {
    return {
      ...state,
      count: action.payload,
      lastOperation: `Set to ${action.payload}`,
      history: [
        ...state.history,
        {
          operation: `Set Value`,
          previousValue: state.count,
          newValue: action.payload,
          timestamp: Date.now(),
        },
      ],
    };
  })
  .addCase(RESET, state => {
    return {
      ...state,
      count: 0,
      lastOperation: 'Reset',
      history: [
        ...state.history,
        {
          operation: 'Reset',
          previousValue: state.count,
          newValue: 0,
          timestamp: Date.now(),
        },
      ],
    };
  })
  .addCase(UNDO, state => {
    if (state.history.length === 0) {
      return state;
    }

    const newHistory = [...state.history];
    newHistory.pop();

    const previousState = newHistory.length > 0 ? newHistory[newHistory.length - 1].newValue : 0;

    return {
      ...state,
      count: previousState,
      lastOperation: 'Undo',
      history: newHistory,
    };
  })
  .build();

// Create an async reducer for simulating API calls
interface FetchNumberState {
  randomNumberFactor: number;
}

// Simulate an API call to fetch a random number
const fetchRandomNumber = async (multiplier: number): Promise<number> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(Math.floor(Math.random() * 100 * multiplier));
    }, 1000);
  });
};

// Create the async reducer
const { reducer: asyncReducer, actions: asyncActions } = createAsyncReducer<
  FetchNumberState,
  number,
  number
>('fetchRandomNumber', fetchRandomNumber);

// Create a complex state transition for a multi-step operation
const complexOperation =
  (amount: number, delay: number) =>
  async (getState: () => CounterState, setState: (update: Partial<CounterState>) => void) => {
    // Step 1: Update the state to indicate operation in progress
    setState({
      lastOperation: `Starting complex operation (${amount})...`,
    });

    // Step 2: Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, delay));

    // Step 3: Get current state and perform calculation
    const currentState = getState();
    const currentCount = currentState.count;
    const newCount = currentCount + amount;

    // Step 4: Update with the result
    setState({
      count: newCount,
      lastOperation: `Completed complex operation: ${currentCount} + ${amount} = ${newCount}`,
      history: [
        ...currentState.history,
        {
          operation: `Complex Operation (${amount})`,
          previousValue: currentCount,
          newValue: newCount,
          timestamp: Date.now(),
        },
      ],
    });

    // Return some result if needed
    return newCount;
  };

// Demo Component
const TypeSafeStateDemo: React.FC = () => {
  // Use our typed reducer
  const [state, actions] = useTypedReducer(counterReducer, initialState, {
    increment,
    decrement,
    add,
    reset,
    setCount,
    undo,
  });

  // Use our typed transitions
  const [transitionState, setTransitionState, runTransition] =
    useTypedTransitions<CounterState>(initialState);

  // Use our async reducer
  const [asyncState, dispatch] = React.useReducer(asyncReducer, {
    randomNumberFactor: 1,
    loading: false,
    error: null,
    data: null,
  });

  // Local state for the add input
  const [addAmount, setAddAmount] = useState<number>(0);
  const [complexAmount, setComplexAmount] = useState<number>(5);

  // Run a complex transition when button is clicked
  const handleRunTransition = async () => {
    const result = await runTransition(complexOperation(complexAmount, 1000));
    console.log('Transition completed with result:', result);
  };

  // Trigger the async action
  const handleFetchRandom = () => {
    asyncActions.trigger(asyncState.randomNumberFactor)(dispatch);
  };

  // Apply the random number when fetched
  useEffect(() => {
    if (asyncState.data !== null) {
      actions.add(asyncState.data);
    }
  }, [asyncState.data, actions]);

  return (
    <div className="type-safe-state-demo">
      <h2>Type-Safe State Management Demo</h2>

      <div className="demo-sections">
        {/* Type-safe Reducer Demo */}
        <section className="demo-section">
          <h3>Reducer-Based State</h3>

          <div className="counter-display">
            <div className="count-value">{state.count}</div>
            <div className="operation-info">Last operation: {state.lastOperation}</div>
          </div>

          <div className="action-buttons">
            <button onClick={() => actions.increment()} className="action-button">
              Increment
            </button>

            <button onClick={() => actions.decrement()} className="action-button">
              Decrement
            </button>

            <div className="add-group">
              <input
                type="number"
                value={addAmount}
                onChange={e => setAddAmount(parseInt(e.target.value) || 0)}
                className="number-input"
              />
              <button onClick={() => actions.add(addAmount)} className="action-button">
                Add Amount
              </button>
            </div>

            <button onClick={() => actions.reset()} className="action-button">
              Reset
            </button>

            <button
              onClick={() => actions.undo()}
              className="action-button"
              disabled={state.history.length === 0}
            >
              Undo
            </button>
          </div>

          <div className="history-log">
            <h4>Action History</h4>
            <ul>
              {state.history
                .slice(-5)
                .reverse()
                .map((entry, index) => (
                  <li key={index}>
                    <span className="operation">{entry.operation}</span>
                    <span className="values">
                      {entry.previousValue} → {entry.newValue}
                    </span>
                    <span className="timestamp">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </section>

        {/* Type-safe Transitions Demo */}
        <section className="demo-section">
          <h3>Complex State Transitions</h3>

          <div className="counter-display">
            <div className="count-value">{transitionState.count}</div>
            <div className="operation-info">Last operation: {transitionState.lastOperation}</div>
          </div>

          <div className="action-buttons">
            <div className="add-group">
              <input
                type="number"
                value={complexAmount}
                onChange={e => setComplexAmount(parseInt(e.target.value) || 0)}
                className="number-input"
              />
              <button onClick={handleRunTransition} className="action-button">
                Run Complex Transition
              </button>
            </div>
          </div>

          <p className="info-text">
            The complex transition demonstrates a multi-step state update with async operations,
            while maintaining full type safety throughout the process.
          </p>
        </section>

        {/* Async Reducer Demo */}
        <section className="demo-section">
          <h3>Async Reducer</h3>

          <div className="counter-display">
            <div className="status-indicator">
              {asyncState.loading
                ? 'Loading...'
                : asyncState.data !== null
                  ? `Got: ${asyncState.data}`
                  : 'Idle'}
            </div>

            {asyncState.error && (
              <div className="error-message">Error: {asyncState.error.message}</div>
            )}
          </div>

          <div className="action-buttons">
            <div className="add-group">
              <label>
                Multiplier:
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={asyncState.randomNumberFactor}
                  onChange={e =>
                    dispatch({
                      type: 'UPDATE_FACTOR',
                      payload: parseInt(e.target.value) || 1,
                    })
                  }
                  className="number-input"
                />
              </label>

              <button
                onClick={handleFetchRandom}
                className="action-button"
                disabled={asyncState.loading}
              >
                Fetch Random Number
              </button>
            </div>
          </div>

          <p className="info-text">
            This demo shows type-safe async reducers. The fetched number will be applied to the
            counter when received, demonstrating integration between reducers.
          </p>
        </section>
      </div>

      <div className="type-safety-benefits">
        <h3>Benefits of Type-Safe State Management</h3>
        <ul>
          <li>Catch type errors at compile-time instead of runtime</li>
          <li>Improved IntelliSense and autocompletion for actions and state</li>
          <li>Safer refactoring with static type checking</li>
          <li>Self-documenting code with explicit action and state types</li>
          <li>Better maintainability with exhaustive case handling</li>
        </ul>
      </div>

      <style jsx>{`
        .type-safe-state-demo {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        h2 {
          color: #333;
          border-bottom: 2px solid #4285f4;
          padding-bottom: 10px;
        }

        .demo-sections {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .demo-section {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        h3 {
          color: #4285f4;
          margin-top: 0;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }

        .counter-display {
          text-align: center;
          margin-bottom: 20px;
        }

        .count-value {
          font-size: 3rem;
          font-weight: bold;
          color: #333;
        }

        .operation-info {
          color: #666;
          font-style: italic;
          margin-top: 5px;
        }

        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }

        .action-button {
          padding: 8px 16px;
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .action-button:hover {
          background-color: #3367d6;
        }

        .action-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .add-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .number-input {
          width: 60px;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          text-align: center;
        }

        .history-log {
          margin-top: 20px;
          background: #fff;
          border-radius: 4px;
          padding: 10px;
          border: 1px solid #eee;
        }

        .history-log h4 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #555;
        }

        .history-log ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .history-log li {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #f0f0f0;
          font-size: 0.9rem;
        }

        .operation {
          font-weight: bold;
          color: #4285f4;
        }

        .values {
          color: #666;
        }

        .timestamp {
          color: #999;
          font-size: 0.8rem;
        }

        .status-indicator {
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .error-message {
          color: #d32f2f;
          margin: 10px 0;
        }

        .info-text {
          font-size: 0.9rem;
          color: #666;
          line-height: 1.5;
          margin-top: 15px;
        }

        .type-safety-benefits {
          background: #f0f7ff;
          border-radius: 8px;
          padding: 20px;
          border-left: 4px solid #4285f4;
        }

        .type-safety-benefits h3 {
          margin-top: 0;
          color: #4285f4;
          border-bottom: none;
          padding-bottom: 0;
        }

        .type-safety-benefits ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }

        .type-safety-benefits li {
          margin-bottom: 8px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default TypeSafeStateDemo;
