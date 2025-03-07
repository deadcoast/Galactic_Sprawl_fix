# CodeBase Document Index (`CDI`)

1. It is of the utmost importance you follow the workflow in this file for codebase consistency. I Have provided extensive documentation `CDI` on the development so far in @CodeBase_Docs . Before you generate code, you should see if there is any documentation to help the implementation and generation .

2. For each task, Ensure you are seeking context in the `CodeBase_Docs` directory to handle the task gracefully.

3. When you are Generating Code for a Task on the `Scratchpad` Tasklist, implement it in smaller managable steps over sever responses to ensure it is consistent with the CodeBase.

`CodeBase_Docs/CodeBase_Architecture.md` - For Specifics on the code base structure, methods, and architecture.
`CodeBase_Docs/CodeBase_Mapping` - A Living directory that is to be ONLY updated with specific files, their locations, and purpose to keep track of the code base.
`CodeBase_Docs/CodeBase_Error_Log.md` - A File to log common issues while debugging, to AVOID them later in development.
`CodeBase_Docs/CodeBase_Linting_Progress.md` - A Linter Log to document best practises, do's and donts to avoid future linting errors.

---

# Workflow & Instructions(`WFI`)

1. During your interaction with the user, if you find anything reusable in this project (e.g. version of a library, model name, or methods used), especially about a fix to a mistake you made or a correction you received, you should take note in the `CodeBase_Docs/CodeBase_Architecture.md` file so you will not make the same mistake again.

2. You must update the `CodeBase_Docs/CodeBase_Mapping` file as a navigation guide to easily navigate the codebase and its assets to circumvent duplication and codebase conflicts. a `CodeBase_Docs/CodeBase_Mapping` file should be ADDITIVE, not destructive. The point is to maintain a complete map of the entire code base. Do not remove entries or information from the file.

3. You will operate on a sctrict workflow called `Rule of Seven` or `RO7`.

   1. Review the Scratchpad for the current task and plan the steps to complete the task
   2. Search `CodeBase_Docs/CodeBase_Mapping` for existing implementations, if none found search the codebase and adjust the plan if necessary
   3. Take action to complete the task
   4. Review the codebase for any missing implementations required by the most recent task changes.
   5. Identify gaps in current implementations, plan necessary steps toimplement missing features.
   6. Update the `Scratchpad` section.
   7. Finally, update the `CodeBase_Docs/CodeBase_Architecture.md` and `CodeBase_Docs/CodeBase_Mapping` files for code base consistency.

4. Use the `.cursorrules` file as a `Scratchpad` to organize your thoughts. Especially when you receive a new task, you should first review the content of the Scratchpad, clear old different task if necessary, first explain the task, and plan the steps you need to take to complete the task. You can use todo markers to indicate the progress, e.g.

```
[X] Task 1
[ ] Task 2
```

Also update the progress of the task in the Scratchpad when you finish a subtask.
Especially when you finished a milestone, it will help to improve your depth of task accomplishment to use the Scratchpad to reflect and plan. You should add only small and essential notes with the `Scratchpad` plan.
The goal is to help you maintain a big picture as well as the progress of the task. Always refer to the Scratchpad when you plan the next step.

## CRITICAL TESTING RULES(`CTR`) - NO EXCEPTIONS

- **NEVER CREATE MOCK TESTS OR USE MOCKING IN TESTS**
- **ALWAYS USE ACTUAL IMPLEMENTATIONS INSTEAD OF MOCKS**
- **NEVER CORRECT CODE BY COMMENTING IT OUT WITH "\_"**
- **WHEN FINDING MOCKS IN TESTS, REPLACE THEM WITH ACTUAL IMPLEMENTATIONS**
- **TESTS SHOULD VERIFY REAL BEHAVIOR, NOT MOCK BEHAVIOR**
- **AVOID TEST UTILITIES THAT CREATE MOCK IMPLEMENTATIONS**
- **AVOID CREATING NEW FILES WHEN ASKED TO CORRECT A FILE**
- **NEVER CREATE ANY FUNCTIONS THAT DON'T EXIST IN THE ORIGINAL CODEBASE**
- **ONLY CREATE ACTUAL INSTANCES OF REAL CLASSES AND USE THEIR EXISTING METHODS DIRECTLY**
- **NEVER ADD WRAPPER FUNCTIONS AROUND EXISTING METHODS**
- **NEVER ABSTRACT OR ALTER EXISTING FUNCTIONALITY**
- **NEVER CREATE YOUR OWN IMPLEMENTATIONS OF EXISTING METHODS**
- **ALWAYS EXAMINE THE ACTUAL CODEBASE BEFORE WRITING ANY TEST CODE**
- **ONLY ADD MINIMAL SETUP/TEARDOWN FUNCTIONALITY IF ABSOLUTELY REQUIRED**
- **NEVER MAKE ASSUMPTIONS ABOUT THE CODE - ALWAYS VERIFY FIRST**
- **TEST FACTORIES SHOULD ONLY CREATE REAL INSTANCES OF EXISTING CLASSES**
- **ANY ADDED METHODS MUST BE MINIMAL AND ONLY FOR SETUP/TEARDOWN/RESET**

These rules are absolute and must be followed without exception. Mocking leads to brittle tests that don't verify actual functionality and create maintenance burdens. All tests must use real implementations to ensure they're testing what users will actually experience.

---

# Scratchpad
