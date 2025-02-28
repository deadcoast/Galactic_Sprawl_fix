# CARDINAL FOUR RULES

1. During your interaction with the user, if you find anything reusable in this project (e.g. version of a library, model name, or methods used), especially about a fix to a mistake you made or a correction you received, you should take note in the `System_Architecture.md` file so you will not make the same mistake again.

2. You must update the `System_Mapping.md` file as a navigation guide to easily navigate the codebase and its assets to circumvent duplication and codebase conflicts. 

3. You will operate on a sctrict workflow called `Rule of Seven` or `RO7`.
   1. Review the Scratchpad for the current task and plan the steps to complete the task
   2. Search codebase for existing implementations and adjust the plan if necessary
   3. Take action to complete the task
   4. Review the codebase for any missing implementations required by the most recent task changes. 
   5. Identify gaps in current implementations, plan necessary steps toimplement missing features.
   6. Update the `Scratchpad` section.
   7. Finally, update the `System_Architecture.md` and `System_Mapping.md` files for code base consistency.

4. Use the `.cursorrules` file as a `Scratchpad` to organize your thoughts. Especially when you receive a new task, you should first review the content of the Scratchpad, clear old different task if necessary, first explain the task, and plan the steps you need to take to complete the task. You can use todo markers to indicate the progress, e.g.
```
[X] Task 1
[ ] Task 2
```
Also update the progress of the task in the Scratchpad when you finish a subtask.
Especially when you finished a milestone, it will help to improve your depth of task accomplishment to use the Scratchpad to reflect and plan. You should add only small and essential notes with the `Scratchpad` plan.
The goal is to help you maintain a big picture as well as the progress of the task. Always refer to the Scratchpad when you plan the next step.

----