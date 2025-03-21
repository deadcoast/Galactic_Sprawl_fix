# Cursor - Rules for AI

Using rules in Cursor you can control the behavior of the underlying model. You can think of it as instructions and/or a system prompt for LLMs.

Inside Cursor, we have two main ways to customize the behavior of the AI to suit your needs:

## Project Rules

Rules specific to a project, stored in the `.cursor/rules` directory. They are automatically included when matching files are referenced.

## Global Rules

Rules applied globally to all projects, configured in the `Cursor Settings` > `General` > `Rules for AI` section.

Learn more about how to use them in the following sections.

![](https://mintlify.s3.us-west-1.amazonaws.com/cursor/images/context/project-rules.png)

Project rules offer a powerful and flexible system with path specific configurations. Project rules are stored in the `.cursor/rules` directory and provide granular control over AI behavior in different parts of your project.

Here’s how they work

- **Semantic Descriptions**: Each rule can include a description of when it should be applied
- **File Pattern Matching**: Use glob patterns to specify which files/folders the rule applies to
- **Automatic Attachment**: Rules can be automatically included when matching files are referenced
- **Reference files**: Use @file in your project rules to include them as context when the rule is applied.

You can reference rule files using @file, allowing you to chain multiple rules together

You can create a new rule using the command palette with `Cmd + Shift + P` > `New Cursor Rule`. By using project rules you also get the benefit of version control since it’s just a file

Example use cases:

- Framework-specific rules for certain file types (e.g., SolidJS preferences for `.tsx` files)
- Special handling for auto-generated files (e.g., `.proto` files)
- Custom UI development patterns
- Code style and architecture preferences for specific folders

## [Global Rules​](https://docs.cursor.com/context/#global-rules)

Global rules can be added by modifying the `Rules for AI` section under `Cursor Settings` > `General` > `Rules for AI`. This is useful if you want to specify rules that should always be included in every project like output language, length of responses etc.

![](https://mintlify.s3.us-west-1.amazonaws.com/cursor/images/context/rules-for-ai.png)

## [`.cursorrules`​](https://docs.cursor.com/context/#cursorrules)

For backward compatibility, you can still use a `.cursorrules` file in the root of your project. We will eventually remove .cursorrules in the future, so we recommend migrating to the new Project Rules system for better flexibility and control.

[Codebase Indexing](https://docs.cursor.com/context/codebase-indexing)[Overview](https://docs.cursor.com/context/@-symbols/overview)