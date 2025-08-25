import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { RefreshCw, ChevronDown, Settings, Wand2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { RegenerationPreset, UserPreferences } from '../lib/enhanced-prompt-utils';

interface RegenerationDropdownProps {
  onRegenerate: (options?: {
    preset?: RegenerationPreset;
    customPrompt?: string;
    useUserStyle?: boolean;
  }) => void;
  isRegenerating: boolean;
  user?: any;
}

export default function RegenerationDropdown({ 
  onRegenerate, 
  isRegenerating, 
  user 
}: RegenerationDropdownProps) {
  const [presets, setPresets] = useState<RegenerationPreset[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    if (user) {
      loadPresets();
      loadUserPreferences();
    }
  }, [user]);

  const loadPresets = async () => {
    try {
      const { data, error } = await supabase
        .from('regeneration_presets')
        .select('*')
        .eq('is_default', true)
        .order('name');
      
      if (error) {
        console.error('Error loading presets:', error);
        return;
      }
      
      setPresets(data || []);
    } catch (err) {
      console.error('Error loading presets:', err);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error loading user preferences:', error);
        return;
      }
      
      setUserPreferences(data);
    } catch (err) {
      console.error('Error loading user preferences:', err);
    }
  };

  const handlePresetRegenerate = (preset: RegenerationPreset) => {
    onRegenerate({ preset });
  };

  const handleUserStyleRegenerate = () => {
    onRegenerate({ useUserStyle: true });
  };

  const handleCustomRegenerate = () => {
    if (customPrompt.trim()) {
      onRegenerate({ customPrompt: customPrompt.trim() });
      setShowCustomDialog(false);
      setCustomPrompt('');
    }
  };

  const handleSimpleRegenerate = () => {
    onRegenerate();
  };

  // If user is not logged in, show simple regenerate button
  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSimpleRegenerate}
        disabled={isRegenerating}
        className="flex items-center gap-2 px-2 md:px-3"
        title={isRegenerating ? "Regenerating..." : "Regenerate content"}
      >
        <RefreshCw
          className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
        />
        <span className="hidden sm:inline">
          {isRegenerating ? "Regenerating..." : "Regenerate"}
        </span>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isRegenerating}
            className="flex items-center gap-2 px-2 md:px-3"
            title={isRegenerating ? "Regenerating..." : "Regenerate options"}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </span>
            <ChevronDown className="h-3 w-3 hidden sm:inline" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Regeneration Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleSimpleRegenerate}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Standard Regenerate
          </DropdownMenuItem>
          
          {userPreferences && userPreferences.writing_samples.length > 0 && (
            <DropdownMenuItem onClick={handleUserStyleRegenerate}>
              <Settings className="h-4 w-4 mr-2" />
              Use My Writing Style
            </DropdownMenuItem>
          )}
          
          {presets.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Quick Styles</DropdownMenuLabel>
              {presets.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => handlePresetRegenerate(preset)}
                  className="flex flex-col items-start gap-1"
                >
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-3 w-3" />
                    <span className="font-medium">{preset.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground pl-5">
                    {preset.description}
                  </span>
                </DropdownMenuItem>
              ))}
            </>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCustomDialog(true)}>
            <Wand2 className="h-4 w-4 mr-2" />
            Custom Instructions
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Custom Regeneration</DialogTitle>
            <DialogDescription>
              Provide specific instructions for how you'd like the content to be regenerated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="e.g., Make it more beginner-friendly with step-by-step explanations..."
              value={customPrompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCustomRegenerate}
              disabled={!customPrompt.trim()}
            >
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}