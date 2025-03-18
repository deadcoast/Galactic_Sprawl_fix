import * as React from "react";
import { forwardRef } from 'react';
import { Button, ButtonProps } from '../Button';
import { cn } from '../../../../utils/cn';
import { ResourceType } from "./../../../../types/resources/ResourceTypes";
/**
 * Ability interface for game abilities
 */
export interface Ability {
  /** Unique ID of the ability */
  id: string;
  /** Display name of the ability */
  name: string;
  /** Description of what the ability does */
  description: string;
  /** URL or path to the ability's icon */
  iconUrl?: string;
  /** Whether the ability is passive (always active) */
  isPassive?: boolean;
  /** Whether the ability is unlocked */
  isUnlocked?: boolean;
  /** The ability's cooldown in seconds (0 means no cooldown) */
  cooldown: number;
  /** The ability's energy cost */
  energyCost?: number;
  /** The ability's mana cost */
  manaCost?: number;
  /** The ability's required level */
  requiredLevel?: number;
  /** The ability's damage type */
  damageType?: 'physical' | ResourceType.ENERGY | 'thermal' | 'explosive' | 'none';
  /** The ability's range in units */
  range?: number;
  /** The ability's duration in seconds */
  duration?: number;
  /** Tags for filtering and categorization */
  tags?: string[];
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * AbilityButton props
 */
export interface AbilityButtonProps extends Omit<ButtonProps, 'leadingIcon'> {
  /** The ability to display */
  ability: Ability;
  /** Current cooldown time remaining in seconds */
  cooldownRemaining?: number;
  /** Whether the player has enough resources to use this ability */
  hasResources?: boolean;
  /** Whether to show the cooldown timer */
  showCooldown?: boolean;
  /** Whether to show the ability tooltip on hover */
  showTooltip?: boolean;
  /** Whether to show the key binding */
  showKeybinding?: boolean;
  /** Keyboard shortcut for this ability */
  keybinding?: string;
  /** Whether the ability is currently selected */
  isSelected?: boolean;
  /** Click handler for the ability */
  onUse?: (ability: Ability) => void;
}

/**
 * AbilityButton component
 * 
 * A specialized button for displaying and activating game abilities,
 * with support for cooldowns, resource costs, and tooltips.
 */
export const AbilityButton = forwardRef<HTMLButtonElement, AbilityButtonProps>(
  (
    {
      ability,
      cooldownRemaining = 0,
      hasResources = true,
      showCooldown = true,
      showTooltip = true,
      showKeybinding = true,
      keybinding,
      isSelected = false,
      className,
      onUse,
      ...props
    },
    ref
  ) => {
    // Calculate cooldown percentage for the overlay
    const cooldownPercent = ability.cooldown > 0
      ? (cooldownRemaining / ability.cooldown) * 100
      : 0;

    // Determine button state
    const isOnCooldown = cooldownRemaining > 0;
    const isDisabled = isOnCooldown || !hasResources || !ability.isUnlocked;
    
    // Handle ability use
    const handleClick = () => {
      if (!isDisabled && onUse) {
        onUse(ability);
      }
    };

    // Create tooltip content
    const tooltipContent = showTooltip ? (
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-800 text-white text-sm rounded shadow-lg z-10 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="font-bold">{ability.name}</div>
        <div className="text-xs mt-1">{ability.description}</div>
        <div className="grid grid-cols-2 gap-x-2 mt-2 text-xs">
          {ability.cooldown > 0 && (
            <div>Cooldown: {ability.cooldown}s</div>
          )}
          {ability.energyCost && ability.energyCost > 0 && (
            <div>Energy: {ability.energyCost}</div>
          )}
          {ability.manaCost && ability.manaCost > 0 && (
            <div>Mana: {ability.manaCost}</div>
          )}
          {ability.range && (
            <div>Range: {ability.range}m</div>
          )}
          {ability.duration && (
            <div>Duration: {ability.duration}s</div>
          )}
          {ability.damageType && ability.damageType !== 'none' && (
            <div>Type: {ability.damageType}</div>
          )}
        </div>
      </div>
    ) : null;

    // Create cooldown overlay
    const cooldownOverlay = (showCooldown && isOnCooldown) ? (
      <div className="absolute inset-0 bg-black bg-opacity-60 rounded-md flex items-center justify-center text-white font-bold">
        <div className="absolute inset-0 bg-black bg-opacity-60" style={{ 
          clipPath: `inset(0 0 ${cooldownPercent}% 0)` 
        }} />
        <span className="z-10">{Math.ceil(cooldownRemaining)}s</span>
      </div>
    ) : null;

    // Create keybinding indicator
    const keybindingIndicator = (showKeybinding && keybinding) ? (
      <div className="absolute top-0 right-0 bg-gray-800 text-white text-xs px-1 rounded-bl-md">
        {keybinding}
      </div>
    ) : null;

    // Icon for the ability
    const abilityIcon = ability.iconUrl ? (
      <img 
        src={ability.iconUrl} 
        alt={ability.name} 
        className="w-6 h-6"
      />
    ) : (
      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
        <span className="text-xs">{ability.name.charAt(0)}</span>
      </div>
    );

    return (
      <div className={cn(
        "relative group",
        isSelected && "ring-2 ring-blue-500 rounded-md",
        className
      )}>
        {tooltipContent}
        
        <Button
          ref={ref}
          variant={ability.isPassive ? 'tertiary' : 'primary'}
          disabled={isDisabled}
          onClick={handleClick}
          className={cn(
            "relative min-w-[48px] min-h-[48px] p-2",
            !hasResources && !isOnCooldown && "border-red-500 border-2",
            ability.isPassive && "bg-gray-200 text-gray-700"
          )}
          leadingIcon={abilityIcon}
          {...props}
        >
          {props?.children}
        </Button>
        
        {cooldownOverlay}
        {keybindingIndicator}
        
        {!ability.isUnlocked && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        )}
      </div>
    );
  }
);

AbilityButton.displayName = 'AbilityButton';

export default AbilityButton;