import os

def add_header_to_file(file_path):
    # Skip if it's a directory or node_modules
    if os.path.isdir(file_path) or 'node_modules' in file_path or 'venv' in file_path:
        return
        
    # Skip if it's a binary file or doesn't exist
    if not os.path.isfile(file_path):
        return
        
    with open(file_path, 'r+', encoding='utf-8') as f:
        content = f.read()
        
        # Skip if header already exists
        if 'Copyright (c) 2025 Vinith Raj' in content:
            return
            
        # Get the appropriate comment style
        ext = os.path.splitext(file_path)[1].lower()
        if ext in ['.py', '.pyw']:
            header = '''"""
Copyright (c) 2025 Vinith Raj

This file is part of AgenticEmail.
AgenticEmail is free software: you can use, modify, and/or distribute it
under the terms of the MIT License. See the LICENSE file for more details.

You should have received a copy of the MIT License along with this program.
If not, see <https://opensource.org/licenses/MIT>.
"""

'''
        elif ext in ['.js', '.jsx', '.ts', '.tsx']:
            header = '''/**
 * Copyright (c) 2025 Vinith Raj
 *
 * This file is part of AgenticEmail.
 * AgenticEmail is free software: you can use, modify, and/or distribute it
 * under the terms of the MIT License. See the LICENSE file for more details.
 *
 * You should have received a copy of the MIT License along with this program.
 * If not, see <https://opensource.org/licenses/MIT>.
 */

'''
        elif ext == '.json':
            # JSON files can't have comments, so we'll skip them
            return
        else:
            # Default to Python-style comments for unknown extensions
            header = '''"""
Copyright (c) 2025 Vinith Raj

This file is part of AgenticEmail.
AgenticEmail is free software: you can use, modify, and/or distribute it
under the terms of the MIT License. See the LICENSE file for more details.

You should have received a copy of the MIT License along with this program.
If not, see <https://opensource.org/licenses/MIT>.
"""

'''
        
        # Add shebang back if it exists
        if content.startswith('#!'):
            shebang = content.split('\n', 1)[0] + '\n'
            # If there's a blank line after shebang, preserve it
            if content.startswith(shebang + '\n'):
                shebang += '\n'
            content = content[len(shebang):]
            header = shebang + header
        
        # Write the new content
        f.seek(0, 0)
        f.write(header + content)
        f.truncate()

def main():
    # Define the directories to process
    directories = [
        'app',
        'extension/chrome/packages/extension/src'
    ]
    
    # File extensions to process
    extensions = ['.py', '.js', '.jsx', '.ts', '.tsx']
    
    for directory in directories:
        for root, _, files in os.walk(directory):
            for file in files:
                if any(file.endswith(ext) for ext in extensions):
                    file_path = os.path.join(root, file)
                    try:
                        add_header_to_file(file_path)
                        print(f'Added header to {file_path}')
                    except Exception as e:
                        print(f'Error processing {file_path}: {str(e)}')

if __name__ == '__main__':
    main()
