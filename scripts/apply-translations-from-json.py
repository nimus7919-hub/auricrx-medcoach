#!/usr/bin/env python3
"""
Apply translations from JSON batch files
"""

import json
from pathlib import Path
import sys

def set_nested_key(data, key_path, value):
    """Set a nested key in a dictionary"""
    keys = key_path.split('.')
    current = data
    for k in keys[:-1]:
        if k not in current:
            current[k] = {}
        current = current[k]
    current[keys[-1]] = value

def apply_translations(locale_file, translations_file):
    """Apply translations from a JSON file to a locale file"""
    
    # Load locale data
    with open(locale_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Load translations
    with open(translations_file, 'r', encoding='utf-8') as f:
        translations = json.load(f)
    
    # Apply translations
    updated = 0
    for key, value in translations.items():
        set_nested_key(data, key, value)
        updated += 1
        if updated <= 5:
            print(f"  {key}: {value[:50]}...")
    
    # Save
    with open(locale_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Applied {updated} translations to {locale_file.name}")
    return updated

def main():
    repo_root = Path(__file__).parent.parent
    
    if len(sys.argv) > 1:
        # Apply specific translation file
        trans_file = Path(sys.argv[1])
        if 'zh' in trans_file.name:
            locale_file = repo_root / 'src/i18n/zh.json'
        elif 'pt' in trans_file.name:
            locale_file = repo_root / 'src/i18n/pt.json'
        else:
            print("Could not determine locale from filename")
            return
        
        apply_translations(locale_file, trans_file)
    else:
        # Apply all translation files in scripts directory
        scripts_dir = repo_root / 'scripts'
        for trans_file in scripts_dir.glob('translations-*-batch*.json'):
            print(f"\\nApplying {trans_file.name}...")
            if 'zh' in trans_file.name:
                locale_file = repo_root / 'src/i18n/zh.json'
            elif 'pt' in trans_file.name:
                locale_file = repo_root / 'src/i18n/pt.json'
            else:
                continue
            
            apply_translations(locale_file, trans_file)

if __name__ == '__main__':
    main()
