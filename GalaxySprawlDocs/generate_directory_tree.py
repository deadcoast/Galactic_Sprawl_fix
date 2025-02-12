#!/usr/bin/env python3
import os
from pathlib import Path

def generate_tree(startpath, output_file, ignore_patterns=None):
    if ignore_patterns is None:
        ignore_patterns = [
            '__pycache__', 
            'node_modules',
            '.git',
            'venv',
            '.env',
            '.vscode',
            '.pixelArtAssets',
            '.bolt',
            '.pytest_cache',
            'assets',
            'tools',
            '.DS_Store',
            '.src_backup'
        ]

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('# Galaxy Sprawl Project Directory Structure\n\n')
        f.write('```\n')
        
        for root, dirs, files in os.walk(startpath):
            # Skip ignored directories
            dirs[:] = [d for d in dirs if not any(pattern in d for pattern in ignore_patterns)]
            
            level = root.replace(startpath, '').count(os.sep)
            indent = '│   ' * (level)
            
            # Print directory name
            f.write(f'{indent}{"└── " if level else ""}{os.path.basename(root)}/\n')
            
            subindent = '│   ' * (level + 1)
            for file in sorted(files):
                if not any(pattern in file for pattern in ignore_patterns):
                    f.write(f'{subindent}└── {file}\n')
        
        f.write('```\n')

if __name__ == "__main__":
    # Get the project root directory (assuming script is in GalaxySprawlDocs)
    project_root = Path(__file__).parent.parent
    output_file = project_root / "GalaxySprawlDocs" / "directory_structure.md"
    
    generate_tree(str(project_root), str(output_file))
    print(f"Directory tree has been saved to {output_file}") 