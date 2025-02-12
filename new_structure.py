#!/usr/bin/env python3
"""
Production‐Ready Script to Reorganize the Project's Directory Structure

This script:
  • Creates the new directory tree (inside src/) as specified.
  • Moves files from their old locations into the new locations.
  • Reorganizes top-level CSS files under src/styles/ into one of three subdirectories:
      - files whose names contain "effects" (case‑insensitive) go to src/styles/effects
      - files whose names contain "ui" go to src/styles/ui
      - all other CSS files go to src/styles/components

Usage:
  # To do a dry run (simulate actions without moving files):
  python3 reorganize_project.py --dry-run

  # To actually perform the moves:
  python3 reorganize_project.py
"""

import os
import shutil
import argparse
import logging
import sys
from datetime import datetime
from typing import Dict, List, Optional

# Configure logging for detailed output
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)

# ---------------------------------------------------------------------
# 1. NEW DIRECTORY STRUCTURE (relative to the project root)
# ---------------------------------------------------------------------
NEW_DIRS = [
    # Types
    "src/types",
    "src/types/factions",
    "src/types/ships",
    "src/types/combat",
    "src/types/ui",
    
    # Config
    "src/config",
    "src/config/factions",
    "src/config/ships",
    "src/config/combat",
    "src/config/game",
    
    # Components
    "src/components",
    "src/components/ships",
    "src/components/ships/common",
    "src/components/ships/player",
    "src/components/ships/player/prefabs",
    "src/components/ships/player/controls",
    "src/components/ships/factions",
    "src/components/ships/factions/spaceRats",
    "src/components/ships/factions/lostNova",
    "src/components/ships/factions/equatorHorizon",
    "src/components/combat",
    "src/components/ui",
    "src/components/colony",
    "src/components/mining",
    "src/components/exploration",
    "src/components/visual",
    "src/components/debug",  # For debug components
    
    # Effects
    "src/effects",
    "src/effects/combat",
    "src/effects/visual",
    "src/effects/particles",
    
    # Hooks
    "src/hooks",
    "src/hooks/factions",
    "src/hooks/combat",
    "src/hooks/ui",
    "src/hooks/game",
    "src/hooks/debug",  # For debug hooks
    
    # Lib
    "src/lib",
    "src/lib/factions",
    "src/lib/combat",
    "src/lib/ai",
    "src/lib/game",
    
    # Utils
    "src/utils",
    "src/utils/math",
    "src/utils/types",
    
    # Contexts
    "src/contexts",
    
    # Styles
    "src/styles",
    "src/styles/components",
    "src/styles/effects",
    "src/styles/ui",
]

# ---------------------------------------------------------------------
# 2. FILE MOVES MAPPING (old relative path -> new relative path)
# ---------------------------------------------------------------------
FILE_MOVES = {
    # --- Types
    "src/components/factions/types/FactionTypes.ts": "src/types/factions/FactionTypes.ts",
    "src/components/factions/types/ShipTypes.ts": "src/types/ships/ShipTypes.ts",
    "src/components/factions/types/CombatTypes.ts": "src/types/combat/CombatTypes.ts",
    "src/components/factions/factionTypes/ship.ts": "src/types/ships/ship.ts",
    "src/components/factions/types/index.ts": "src/types/index.ts",
    "src/components/factions/types/common.ts": "src/types/common.ts",
    "src/components/factions/types/UITypes.ts": "src/types/ui/UITypes.ts",
    
    # --- Config
    "src/components/factions/config/factionConfig.ts": "src/config/factions/factionConfig.ts",
    "src/components/factions/config/shipStats.ts": "src/config/ships/shipStats.ts",
    "src/components/factions/config/weaponConfig.ts": "src/config/combat/weaponConfig.ts",
    "src/components/factions/config/factionShipStats.ts": "src/config/factions/factionShipStats.ts",
    "src/config/playerShipStats.ts": "src/config/ships/playerShipStats.ts",
    
    # --- Components: Ship Base
    "src/components/factions/ships/components/ShipBase.tsx": "src/components/ships/common/ShipBase.tsx",
    "src/components/factions/ships/components/WeaponMount.tsx": "src/components/ships/common/WeaponMount.tsx",
    "src/components/ships/common/ShipStats.tsx": "src/components/ships/common/ShipStats.tsx",
    "src/components/ships/common/ShipControls.tsx": "src/components/ships/common/ShipControls.tsx",
    "src/components/ships/common/ShipHealth.tsx": "src/components/ships/common/ShipHealth.tsx",
    "src/components/ships/common/ShipShields.tsx": "src/components/ships/common/ShipShields.tsx",
    "src/components/ships/common/ShipWeapons.tsx": "src/components/ships/common/ShipWeapons.tsx",
    
    # --- Components: Player Ships
    "src/components/playerShips/WarShipCombat.tsx": "src/components/ships/player/WarShipCombat.tsx",
    "src/components/playerShips/PlayerShipControls.tsx": "src/components/ships/player/controls/PlayerShipControls.tsx",
    "src/components/playerShips/PlayerWeaponControls.tsx": "src/components/ships/player/controls/PlayerWeaponControls.tsx",
    
    # --- Components: Space Rats Ships
    "src/components/factions/ships/spaceRats/RatKing.tsx": "src/components/ships/factions/spaceRats/RatKing.tsx",
    "src/components/factions/ships/spaceRats/AsteroidMarauder.tsx": "src/components/ships/factions/spaceRats/AsteroidMarauder.tsx",
    "src/components/factions/ships/spaceRats/RogueNebula.tsx": "src/components/ships/factions/spaceRats/RogueNebula.tsx",
    
    # --- Components: Lost Nova Ships
    "src/components/factions/ships/lostNova/EclipseScythe.tsx": "src/components/ships/factions/lostNova/EclipseScythe.tsx",
    "src/components/factions/ships/lostNova/DarkMatterReaper.tsx": "src/components/ships/factions/lostNova/DarkMatterReaper.tsx",
    "src/components/factions/ships/lostNova/NullHunter.tsx": "src/components/ships/factions/lostNova/NullHunter.tsx",
    
    # --- Components: Equator Horizon Ships
    "src/components/factions/ships/equatorHorizon/CelestialArbiter.tsx": "src/components/ships/factions/equatorHorizon/CelestialArbiter.tsx",
    "src/components/factions/ships/equatorHorizon/EtherealGalleon.tsx": "src/components/ships/factions/equatorHorizon/EtherealGalleon.tsx",
    "src/components/factions/ships/equatorHorizon/StellarEquinox.tsx": "src/components/ships/factions/equatorHorizon/StellarEquinox.tsx",
    
    # --- Components: Faction UI
    "src/components/factions/FactionAI.tsx": "src/components/ships/factions/FactionAI.tsx",
    "src/components/factions/FactionFleet.tsx": "src/components/ships/factions/FactionFleet.tsx",
    "src/components/factions/FactionManager.tsx": "src/components/ships/factions/FactionManager.tsx",
    "src/components/factions/SpaceRatShip.tsx": "src/components/ships/factions/spaceRats/SpaceRatShip.tsx",
    "src/components/factions/LostNovaShip.tsx": "src/components/ships/factions/lostNova/LostNovaShip.tsx",
    "src/components/factions/EquatorHorizonShip.tsx": "src/components/ships/factions/equatorHorizon/EquatorHorizonShip.tsx",
    
    # --- Components: Combat
    "src/components/combat/CombatManager.tsx": "src/components/combat/CombatManager.tsx",
    "src/components/combat/CombatUI.tsx": "src/components/combat/CombatUI.tsx",
    "src/components/combat/DamageIndicator.tsx": "src/components/combat/DamageIndicator.tsx",
    "src/components/combat/TargetingSystem.tsx": "src/components/combat/TargetingSystem.tsx",
    "src/components/combat/WeaponSystem.tsx": "src/components/combat/WeaponSystem.tsx",
    "src/components/combat/ShieldSystem.tsx": "src/components/combat/ShieldSystem.tsx",
    "src/components/combat/PowerSystem.tsx": "src/components/combat/PowerSystem.tsx",
    "src/components/combat/SalvageSystem.tsx": "src/components/combat/SalvageSystem.tsx",
    
    # --- Components: UI
    "src/components/ui/ShipCard.tsx": "src/components/ui/ShipCard.tsx",
    "src/components/ui/WeaponCard.tsx": "src/components/ui/WeaponCard.tsx",
    "src/components/ui/StatusBar.tsx": "src/components/ui/StatusBar.tsx",
    "src/components/ui/ResourceDisplay.tsx": "src/components/ui/ResourceDisplay.tsx",
    "src/components/ui/Tooltip.tsx": "src/components/ui/Tooltip.tsx",
    "src/components/ui/Modal.tsx": "src/components/ui/Modal.tsx",
    
    # --- Effects
    "src/components/effects/WeaponEffect.tsx": "src/effects/combat/WeaponEffect.tsx",
    "src/components/effects/ExplosionEffect.tsx": "src/effects/combat/ExplosionEffect.tsx",
    "src/components/effects/ShieldEffect.tsx": "src/effects/combat/ShieldEffect.tsx",
    "src/components/effects/ThrusterEffect.tsx": "src/effects/visual/ThrusterEffect.tsx",
    "src/components/effects/SmokeTrailEffect.tsx": "src/effects/visual/SmokeTrailEffect.tsx",
    
    # --- Hooks
    "src/components/factions/factionHooks/useFactionBehavior.ts": "src/hooks/factions/useFactionBehavior.ts",
    "src/components/factions/factionHooks/useFactionAI.ts": "src/hooks/factions/useFactionAI.ts",
    "src/components/factions/factionHooks/useEnemyAI.ts": "src/hooks/factions/useEnemyAI.ts",
    "src/hooks/useFleetAI.ts": "src/hooks/factions/useFleetAI.ts",
    "src/hooks/useAdaptiveAI.ts": "src/hooks/factions/useAdaptiveAI.ts",
    "src/hooks/useCombatSystem.ts": "src/hooks/combat/useCombatSystem.ts",
    "src/hooks/useTooltip.ts": "src/hooks/ui/useTooltip.ts",
    "src/hooks/useGameState.ts": "src/hooks/game/useGameState.ts",
    
    # --- Lib
    "src/components/factions/factionLib/factionManager.ts": "src/lib/factions/factionManager.ts",
    "src/lib/combatManager.ts": "src/lib/combat/combatManager.ts",
    "src/lib/gameManager.ts": "src/lib/game/gameManager.ts",
    "src/lib/ai/behaviorTree.ts": "src/lib/ai/behaviorTree.ts",
    "src/lib/ai/pathfinding.ts": "src/lib/ai/pathfinding.ts",
    "src/lib/ai/decisionMaking.ts": "src/lib/ai/decisionMaking.ts",
    "src/lib/factions/factionAI.ts": "src/lib/factions/factionAI.ts",
    "src/lib/factions/fleetManager.ts": "src/lib/factions/fleetManager.ts",
    "src/lib/combat/weaponSystem.ts": "src/lib/combat/weaponSystem.ts",
    "src/lib/combat/damageCalculator.ts": "src/lib/combat/damageCalculator.ts",
    "src/lib/game/saveManager.ts": "src/lib/game/saveManager.ts",
    "src/lib/game/resourceManager.ts": "src/lib/game/resourceManager.ts",
    
    # --- Utils
    "src/utils/math.ts": "src/utils/math.ts",
    "src/utils/idGenerator.ts": "src/utils/idGenerator.ts",
    "src/utils/helpers.ts": "src/utils/helpers.ts",
    "src/utils/constants.ts": "src/utils/constants.ts",
    "src/utils/types.ts": "src/utils/types.ts",
    
    # --- Contexts
    "src/contexts/GameContext.tsx": "src/contexts/GameContext.tsx",
    "src/contexts/ThresholdContext.tsx": "src/contexts/ThresholdContext.tsx",
    "src/contexts/CombatContext.tsx": "src/contexts/CombatContext.tsx",
    "src/contexts/FactionContext.tsx": "src/contexts/FactionContext.tsx",
    
    # --- Styles (handled by reorganize_styles function)
    # CSS files will be automatically sorted into effects/ui/components
}

# ---------------------------------------------------------------------
# 3. OPTIONAL: FILE CLEANUP OR EXTRA WARNINGS
#    For example, if there are files you no longer want (or want to flag)
#    you can add rules here.
# ---------------------------------------------------------------------
EXTRA_WARN_FILES = [
    # Files that need review before moving
    "src/contexts/ThresholdTypes.ts",
    "src/components/factions/DiplomacyPanel.tsx",  # Should this move to ui/?
    "src/components/debug/AIDebugOverlay.tsx",     # Should we keep debug components?
    "src/hooks/useDebugOverlay.ts",               # Should we keep debug hooks?
    "src/components/factions/types/index.ts",      # Check if needed after restructure
]

# ---------------------------------------------------------------------
# Command-line argument parsing
# ---------------------------------------------------------------------
def parse_args():
    parser = argparse.ArgumentParser(
        description="Reorganize and move project files from the old structure into the new structure."
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Simulate the file moves without making any changes."
    )
    return parser.parse_args()

# ---------------------------------------------------------------------
# Create new directories if they do not exist.
# ---------------------------------------------------------------------
def create_new_directories(dry_run: bool):
    logging.info("Creating new directory structure ...")
    for directory in NEW_DIRS:
        if os.path.isdir(directory):
            logging.info(f"Directory already exists: {directory}")

        elif dry_run:
            logging.info(f"[DRY RUN] Would create directory: {directory}")
        else:
            try:
                os.makedirs(directory, exist_ok=True)
                logging.info(f"Created directory: {directory}")
            except Exception as e:
                logging.error(f"Error creating directory {directory}: {e}")

# ---------------------------------------------------------------------
# Move a file from src to dst (creating destination folder if needed)
# ---------------------------------------------------------------------
class ProgressTracker:
    def __init__(self):
        self.total_operations = 0
        self.completed_operations = 0
        self.errors = []
        self.warnings = []
        
    def add_error(self, message: str):
        self.errors.append(message)
        logging.error(message)
        
    def add_warning(self, message: str):
        self.warnings.append(message)
        logging.warning(message)
        
    def increment(self):
        self.completed_operations += 1
        self._update_progress()
        
    def set_total(self, total: int):
        self.total_operations = total
        
    def _update_progress(self):
        if self.total_operations > 0:
            percentage = (self.completed_operations / self.total_operations) * 100
            sys.stdout.write(f"\rProgress: [{self.completed_operations}/{self.total_operations}] {percentage:.1f}%")
            sys.stdout.flush()
            
    def generate_report(self) -> str:
        report = [
            "\n=== Restructuring Report ===",
            f"Total operations: {self.total_operations}",
            f"Completed operations: {self.completed_operations}",
            f"Success rate: {(self.completed_operations/self.total_operations)*100:.1f}%",
            "\nErrors:" if self.errors else "",
            *[f"  - {err}" for err in self.errors],
            "\nWarnings:" if self.warnings else "",
            *[f"  - {warn}" for warn in self.warnings],
            "\n==========================="
        ]
        return "\n".join(filter(None, report))

def move_file(src: str, dst: str, dry_run: bool, progress: ProgressTracker):
    if not os.path.exists(src):
        progress.add_warning(f"Source file not found (skipped): {src}")
        return

    dst_dir = os.path.dirname(dst)
    if not os.path.isdir(dst_dir):
        if dry_run:
            logging.info(f"[DRY RUN] Would create directory for destination: {dst_dir}")
        else:
            try:
                os.makedirs(dst_dir, exist_ok=True)
                logging.info(f"Created directory for destination: {dst_dir}")
            except Exception as e:
                progress.add_error(f"Error creating destination directory {dst_dir}: {e}")
                return

    if dry_run:
        logging.info(f"[DRY RUN] Would move: {src} -> {dst}")
        progress.increment()
    else:
        try:
            shutil.move(src, dst)
            logging.info(f"Moved: {src} -> {dst}")
            progress.increment()
        except Exception as e:
            progress.add_error(f"Error moving {src} to {dst}: {e}")

# ---------------------------------------------------------------------
# Process the explicit file moves from the mapping.
# ---------------------------------------------------------------------
def process_file_moves(dry_run: bool, progress: ProgressTracker):
    logging.info("Processing explicit file moves ...")
    # Only count files that actually need to be moved
    moves_needed = [(src, dst) for src, dst in FILE_MOVES.items() 
                   if os.path.exists(src) and not os.path.exists(dst)]
    
    progress.set_total(len(moves_needed))
    for src, dst in moves_needed:
        move_file(src, dst, dry_run, progress)
        
    skipped = len(FILE_MOVES) - len(moves_needed)
    if skipped > 0:
        logging.info(f"Skipped {skipped} files that were already moved or missing.")

# ---------------------------------------------------------------------
# Reorganize top-level CSS files in src/styles/
#
# Rule: For each .css file directly under src/styles (do not process subdirectories):
#   - If its name (case-insensitive) contains "effects", move it to src/styles/effects/
#   - Else if its name contains "ui", move it to src/styles/ui/
#   - Else move it to src/styles/components/
# ---------------------------------------------------------------------
def reorganize_styles(dry_run: bool, progress: ProgressTracker):
    logging.info("Reorganizing CSS files ...")
    styles_root = os.path.join("src", "styles")
    if not os.path.isdir(styles_root):
        progress.add_warning(f"Styles folder not found: {styles_root}")
        return

    css_files = {
        "effects": [],
        "ui": [],
        "components": []
    }

    total_css_files = sum(bool(os.path.isfile(os.path.join(styles_root, item))
                              and item.lower().endswith(".css"))
                      for item in os.listdir(styles_root))
    progress.set_total(progress.total_operations + total_css_files)

    for item in os.listdir(styles_root):
        item_path = os.path.join(styles_root, item)
        if os.path.isfile(item_path) and item.lower().endswith(".css"):
            # Determine destination folder based on filename pattern
            lower_name = item.lower()
            if "effects" in lower_name or "vpr-effects" in lower_name:
                css_files["effects"].append(item)
            elif "ui" in lower_name or "vpr-system" in lower_name:
                css_files["ui"].append(item)
            else:
                css_files["components"].append(item)

    # Move files to their respective directories
    for category, files in css_files.items():
        dest_dir = os.path.join(styles_root, category)
        for file in files:
            src = os.path.join(styles_root, file)
            dst = os.path.join(dest_dir, file)
            move_file(src, dst, dry_run, progress)

# ---------------------------------------------------------------------
# Check for any extra files that might need your attention.
# ---------------------------------------------------------------------
def check_extra_files():
    logging.info("Checking for extra files that may not belong ...")
    for f in EXTRA_WARN_FILES:
        if os.path.exists(f):
            logging.warning(f"Extra file found: {f}  —  Consider removing or moving this file.")
        else:
            logging.info(f"Extra file not found (OK): {f}")

# ---------------------------------------------------------------------
# Create a backup of the src directory before making changes.
# ---------------------------------------------------------------------
def create_backup(dry_run: bool) -> Optional[str]:
    """Create a backup of the src directory before making changes."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"src_backup_{timestamp}"
    
    if not dry_run:
        try:
            shutil.copytree("src", backup_dir)
            logging.info(f"Created backup at: {backup_dir}")
            return backup_dir
        except Exception as e:
            logging.error(f"Failed to create backup: {e}")
            return None
    return None

# ---------------------------------------------------------------------
# Restore from backup if something goes wrong.
# ---------------------------------------------------------------------
def restore_from_backup(backup_dir: str, dry_run: bool) -> bool:
    """Restore from backup if something goes wrong."""
    if not dry_run and os.path.exists(backup_dir):
        try:
            shutil.rmtree("src")
            shutil.copytree(backup_dir, "src")
            logging.info(f"Restored from backup: {backup_dir}")
            return True
        except Exception as e:
            logging.error(f"Failed to restore from backup: {e}")
    return False

# ---------------------------------------------------------------------
# Validation functions
# ---------------------------------------------------------------------
def validate_environment() -> bool:
    """Validate that we're in the correct directory with the right structure."""
    if not os.path.isdir("src"):
        logging.error("No 'src' directory found. Are you in the project root?")
        return False
        
    required_dirs = ["src/components", "src/components/factions"]
    for dir in required_dirs:
        if not os.path.isdir(dir):
            logging.error(f"Required directory not found: {dir}")
            return False
            
    return True

def validate_file_moves() -> bool:
    """Validate that source files exist and destinations won't overwrite existing files."""
    issues_found = False
    already_moved = []
    missing_sources = []
    
    for src, dst in FILE_MOVES.items():
        # If destination exists but source doesn't, file was probably already moved
        if os.path.exists(dst) and not os.path.exists(src):
            already_moved.append((src, dst))
            continue
            
        # If source doesn't exist and destination doesn't exist, that's a real missing file
        if not os.path.exists(src) and not os.path.exists(dst):
            missing_sources.append(src)
            continue
            
        # If both source and destination exist, that's a problem
        if os.path.exists(src) and os.path.exists(dst):
            logging.error(f"Both source and destination exist: {src} -> {dst}")
            issues_found = True
            
        # Validate parent directories don't clash with files
        parent = os.path.dirname(dst)
        while parent:
            if os.path.isfile(parent):
                logging.error(f"Parent path is a file: {parent}")
                issues_found = True
                break
            parent = os.path.dirname(parent)
    
    if already_moved:
        logging.info("\nFiles that appear to be already moved:")
        for src, dst in already_moved:
            logging.info(f"  {src} -> {dst}")
            
    if missing_sources:
        logging.warning("\nFiles that are missing and need to be created:")
        for src in missing_sources:
            logging.warning(f"  {src}")
    
    return not issues_found

def check_disk_space(backup: bool = True) -> bool:
    """Check if there's enough disk space for the operation."""
    try:
        src_size = sum(os.path.getsize(os.path.join(dirpath, filename))
                      for dirpath, _, filenames in os.walk("src")
                      for filename in filenames)
        
        # We need space for:
        # 1. New structure (roughly same as src)
        # 2. Backup if enabled (same as src)
        # 3. Some buffer (20% of src)
        required_space = src_size * (2 if backup else 1) * 1.2
        
        # Get free space in current directory
        free_space = shutil.disk_usage(".").free
        
        if free_space < required_space:
            logging.error(f"Insufficient disk space. Need {required_space/1024/1024:.2f}MB, "
                        f"have {free_space/1024/1024:.2f}MB free.")
            return False
            
        return True
        
    except Exception as e:
        logging.error(f"Error checking disk space: {e}")
        return False

# ---------------------------------------------------------------------
# Main function: create new directories, process explicit moves, and reorganize styles.
# ---------------------------------------------------------------------
def main():
    args = parse_args()
    progress = ProgressTracker()
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Validate environment
    if not validate_environment():
        logging.error("Environment validation failed. Aborting.")
        return
        
    # Validate file moves - now just informational
    validate_file_moves()  # We continue even if this returns False
    
    # Check disk space
    if not check_disk_space(not args.dry_run):
        logging.error("Disk space check failed. Aborting.")
        return
    
    # Create backup first
    backup_dir = create_backup(args.dry_run)
    if not backup_dir and not args.dry_run:
        logging.error("Failed to create backup. Aborting.")
        return
    
    try:
        # Create new directory structure
        create_new_directories(args.dry_run)
        
        # Move files to their new locations
        process_file_moves(args.dry_run, progress)
        
        # Reorganize CSS files
        reorganize_styles(args.dry_run, progress)
        
        # Check for any extra files
        check_extra_files()
        
        if args.dry_run:
            logging.info("Dry run completed. No changes were made.")
        else:
            logging.info("Restructuring completed successfully!")
            
            # Clean up backup after successful completion
            if backup_dir and os.path.exists(backup_dir):
                shutil.rmtree(backup_dir)
                logging.info(f"Removed backup directory: {backup_dir}")
        
        # Print final report
        print(progress.generate_report())
        
    except Exception as e:
        progress.add_error(f"An error occurred during restructuring: {e}")
        if backup_dir and not args.dry_run:
            logging.info("Attempting to restore from backup...")
            if restore_from_backup(backup_dir, args.dry_run):
                logging.info("Successfully restored from backup.")
            else:
                logging.error(f"Failed to restore. Backup remains at: {backup_dir}")
        
        # Print error report
        print(progress.generate_report())
        return

if __name__ == "__main__":
    # Ensure we run from the project root by checking for the 'src' folder.
    if not os.path.isdir("src"):
        logging.error("This script must be run from the project root (the folder containing 'src').")
        sys.exit(1)
    main()
