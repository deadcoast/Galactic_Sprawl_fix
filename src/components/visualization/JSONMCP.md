
## intro

MCP-CLEye is a visual studio that houses and stores your MCP servers. This studio features an aesthetic retro ASCII Terminal feel with a Modern UI Look. The purpose of MCP-CLeye is to provide a central, visually aesthetic place to edit, troubleshoot, and store all of your MCP tools and toolboxes. The Retro ASCII terminal window, fixed inside a modern UI interface, represents the theme of using a terminal (Traditional style of computing) with a modern and aesthetic UI.

### Features

- Provides native terminal integration with the user UI via:
	- Connects to the native terminal via the path to the executable and provides a wrapper retro ASCII interface over the terminal.
	- custom script
	- If possible, utilize an open-source project to provide a base terminal to integrate with this project.

### CLEye Build Terminology

- Parent: Parent Assets that house Widgets and Assets.
- Child: Sub-Parent Assets that are housed inside Parent Assets.
- Categorys: Parent Asset that houses Widgets
- Widgets: Child asset that is housed inside of Parent Assets
- Default Layout refers to elements that exist on all Categorys and tabs.

### Default Assets

- **CLEye ASCII-Terminal**: The dynamic, resizable CLEye Terminal is centred at the bottom of the UI. This placement ensures ample room for the separate CLeye Tabs and Assets.
- **Sidebar Categorys Window**: The sidebar Window contains heirarchal interactive Category Buttons for the "MCP Library," "URL Library," and "Settings." These buttons act as Parent elements for the Child Widgets housed inside them.
- **Bottom Widget Bar**: The Bottom Widget Bar is a horizontal collapsable bar that houses set favourites from the the "MCP Library" and "URL Library" Widgets.
- **Top Widget Bar**: The Top Widget Bar is a horizontal bar that houses the currently active Widgets.

#### Side Bar Window
- Houses Parent Category 'Button' Elements. The word Button refers to the clickable nature; the Category asset should not appear like an actual Button in the UI Side Bar Window. It should appear as aesthetic text, with an arrow indicating Expanded or Contracted.
- The Category Buttons Provide the aesthetic of an IDE file browser, housing buttons in a collapsible hierarchy similar to how file operations work in an IDE.
	- For example, Category Assets act as Parent elements. Users can click a Category button to expand or collapse all the Child Widgets the Category Contains.
	- With the Widgets designed as independent module assets, the UI Side Bar Window and Category UI design provide a true simulated experience of a File Browsing system without all the complexities.

##### Retro CLEye ASCII Terminal

The CLEye Terminal is a Retro ASCII Terminal that is designed to simulate a retro computer Aesthetic. It is designed to be a wrapper attached to the Native terminal, installed/attached via a Path Executable. If this is not possible, another solution, such as an available open-source ASCII, would be utilized and developed as a base for the Retro ASCII UI Wrapper.

**Aesthetics**: The Retro ASCII would feature elements created with UNICODE BARS. Assets such as a Retro Bar Border to house the ASCII type window, the text input box, and the ASCII Box buttons "send"(hotkey enter). The ASCII bar and UI visual assets will include the font: 'MX437 Wang Pro Mono', a retro-looking mono font that will accent the visual aesthetics of the ASCII UI. The text inside the ASCII Terminal will include a separate font, 'MX437 DOS/V re.JPN12', a non-mono font asset that features an 8-bit look.
**Function**: The CLEye Retro ASCII Terminal will install MCP Terminal Commands on the system via terminal npm commands. This is a commonly used option for installing MCP. Alternatively, it will include the command "JSONMCP" to create MCP Widgets with the JSON snippets.
**JSONMCP**: The JSONMCP CLI command is an alternative way to Create a Widget for an MCP Server. It provides interactive prompts to the user to store the JSON code as a new MCP Widget.
- The JSONMCP Command will NOT install the MCP Server but serve as a CLI command to create MCP Widgets with the JSON snippets. In order to install the MCP Server, the user must use the npm command, or input the JSON Snippet via the desired platforms method.
- The JSONMCP Command will NOT confirm if the JSON code is a Valid MCP Server.

- CLEye Backend Triggers:
    - `{JSONMCP_label}`: The label inputted by the user for the new MCP Server Widget.
    - `{JSONMPC_json_snippet}`: The JSON Snippet inputted by the user for the new MCP Server Widget.
    - `(Widget_Link)`: A clickable link to the new MCP Server Widget Tab.

- CLEye Backend Prompt Labels:
    - `{JSONMCP_req_label}`: "Please provide the label of the new MCP Server."
		- This prompt assigns the label of the new MCP Server Widget.
    - `{JSONMCP_Conf_label}`: "Great! The new MCP Server Widget will be stored as {JSONMCP_Input_label}; please provide the JSON Snippet or type N if that is not the correct label." 
		- This prompt confirms the label of the new MCP Server Widget.
    - `{JSONMCP_req_snippet}`: "Please Provide the JSON Snippet for the New MCP Server"
		- This Prompt assigns the JSON Input from the user to the new MCP Server Widget.
    - `{JSONMCP_conf_snippet}`: "Great! I have recieved the JSON snippet for the New MCP Server;`{JSONMCP_json_snippet}` is this Correct? [Y/N]"
		- This prompt confirms the JSON Snippet for the new MCP Server Widget.
    - `{JSONMCP_Saved}`: "Confirmed! Your new MCP Server Widget has been saved as [{JSONMCP_Input_label}](Widget_Link)"
		- This provides a confirmation prompt that the widget was successfully created and a clickable link to the widgets tab.

- The JSONMCP command is simply a snippet-storing utility that includes JSON syntax highlighting, it can be triggered in multiple ways.
- If the JSONMCP CLEye Command is triggered alone, an interactive Prompt begins to create and store a JSON snippet as a new MCP Server Widget.
    - "1. `{JSONMCP_req_label}`"
    - "2. `{JSONMCP_Conf_label}`"
    - "3. `{JSONMCP_req_Snippet}`"
    - "4. `{JSONMCP_conf_snippet}`"
    - "5. `{JSONMCP_Saved}`"
- If the JSONMCP CLEye Command is triggered with plain text beside it: (e.g. 'JSONMCP Claude-Desktop')
    - "1. I see you have included a label `{JSONMCP_label}` with the JSONMPC Command; is this Correct? [Y/N]"
        - If [Y]
            - "2. `{JSONMCP_req_Snippet}`"
            - "3. `{JSONMCP_Saved}`"
        - If [N]
            - "2. `{JSONMCP_req_label}`"
            - "3. `{JSONMCP_Conf_label}`"
            - "4. `{JSONMCP_req_Snippet}`"
            - "5. `{JSONMCP_Saved}`"
- If the JSONMCP CLEye Command is triggered with a JSON snippet:
    - "1. 
        - If [Y]
            - "2. `{JSONMCP_Conf_label}`"
            - "3. `{JSONMCP_Saved}`"
        - If [N]
            - "2. `{JSONMCP_req_label}`"
            - "3. `{JSONMCP_Conf_label}`"
            - "4. `{JSONMCP_req_Snippet}`"
            - "5. `{JSONMCP_Saved}`"

### Categories

Categorys are located as buttons on the left-hand side. When clicked, they expand their housed Widgets(Child Assets).
- Categorys Buttons:
	- MCP Servers: A dedicated Category that displays all the MCP Server widgets that have been added.
	- URL Assets: A dedicated Category that displays all URL Asset widgets has been added.
	- Settings: Settings to customize the MCP CLEye Hub
- Tabs are Child elements inside Parent Categorys. They act as independent elements and can be assigned to the Top Bar(MCP Widgets) or Bottom Bar(URL Widgets).

### Tabs

Tabs are a child element of a Category. They are used to display and interact with Widgets.
- Tabs can be assigned to the Top Bar or Bottom Bar. 
- Tabs act as a container for the Widgets housed inside  Category.
- Tabs are an Midsized element that can be used to display and interact with Widgets.
- When Clicked, Tabs open an expandable interactive and editable container that displays the Widget in a compact form.

### Widgets

Widgets are independent and reusable asset modules. When placed inside A Parent Category, they provide an aesthetic box ui with essential information on the MCP Server. 
When a Widget is clicked, it opens the Dedicated Widget Page.

#### Dedicated Widget Page

The Dedicated Widget Page is a full screen element that displays the Widget in its full form.
- Widgets are Child elements of Categorys.
- The Dedicated Widget Page houses the following elements:
	- Path to Widget
	- A slim text box that displays the npm install command with Syntax Highlighting.
	- A Text box with Syntax Highlighting that Displays the JSON Snippet to the MCP Server.
#### CLeye MCP LIBRARY

- Stores and displays widgets of the current MCPs installed. For each MCP Widget/implementation installed, the widgets display crucial overview information such as:
	- Active Status: The green icon is for on and running, and the red icon is for disabled or not running.
	- Slider options to enable/disable the MCP
	- Platform the MCP is installed in/utilizing (e.g. `ClaudeDesktopCommander` Insalled in: `Claude Desktop`)
	- The path the MCP is installed to
	- The description of the MCP (if available from the installation)
	- If installed from the MCP-CLeye Terminal, the install command is saved and displayed with the widget.
- Each widget, when clicked, opens a Tab in the TOP BAR.

#### CLeye URL Asset UI's

Widgets of essential URL's that provide MCP's for download [e.g.](https://smithery.ai) . These widgets come in two forms:

 **BOTTOM BAR URL FAVOURITES WIDGET**: The URL widgets appear visually as an aesthetic bar at the bottom of the UI. 	
- Each URL added to the favourites list is its own widget tab on the bottom bar. When clicked, it opens the widgets Tab. 
- The Bottom Bar widget has a collapsable arrow at the left side of the bar. This allows users to collapse it into the UI(useful if you only have one or two url added, and the bar isnt filled out).

**CLEye URL TABS**: Similar to the MCP Library Tabs, the Bottom bar acts as an extension to the URL Tabs.
	  

### Future Implementations

#### Troubleshooting

- Run a troubleshoot suite to reinstall the MCP
	- implement other troubleshooting steps.