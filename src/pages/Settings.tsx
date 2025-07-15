import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import type { UserPreferences } from '../lib/enhanced-prompt-utils';

export default function Settings({ user }: { user: any }) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSample, setNewSample] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadPreferences();
  }, [user, navigate]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const defaultPrefs: Partial<UserPreferences> = {
          user_id: user.id,
          writing_samples: [],
          preferred_tone: 'professional',
          preferred_length: 'medium',
          custom_instructions: ''
        };
        setPreferences(defaultPrefs as UserPreferences);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences || !user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          writing_samples: preferences.writing_samples,
          preferred_tone: preferences.preferred_tone,
          preferred_length: preferences.preferred_length,
          custom_instructions: preferences.custom_instructions,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving preferences:', error);
        window.alert('Failed to save preferences. Please try again.');
      } else {
        window.alert('Preferences saved successfully!');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const addWritingSample = () => {
    if (!newSample.trim() || !preferences) return;
    
    setPreferences({
      ...preferences,
      writing_samples: [...preferences.writing_samples, newSample.trim()]
    });
    setNewSample('');
  };

  const removeWritingSample = (index: number) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      writing_samples: preferences.writing_samples.filter((_, i) => i !== index)
    });
  };

  const handleBackClick = () => {
    navigate('/');
  };

  if (!user) {
    return <div className="text-center py-12">Please sign in to access settings.</div>;
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  if (!preferences) {
    return <div className="text-center py-12">Error loading settings.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackClick}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Customize your writing preferences and add samples of your writing style
          </p>
        </div>

        <div className="grid gap-6">
          {/* Basic Preferences */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Writing Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Tone</label>
                <Select
                  value={preferences.preferred_tone}
                  onValueChange={(value: 'casual' | 'professional' | 'technical') =>
                    setPreferences({ ...preferences, preferred_tone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Length</label>
                <Select
                  value={preferences.preferred_length}
                  onValueChange={(value: 'short' | 'medium' | 'long') =>
                    setPreferences({ ...preferences, preferred_length: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Custom Instructions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Custom Instructions</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Add any specific instructions for how you'd like your content generated
            </p>
            <Textarea
              placeholder="e.g., Always include code examples, focus on practical applications, use bullet points for key takeaways..."
              value={preferences.custom_instructions || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setPreferences({ ...preferences, custom_instructions: e.target.value })
              }
              className="min-h-[100px]"
            />
          </Card>

          {/* Writing Samples */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Writing Samples</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Add examples of your writing to help the AI match your style. Include blog posts, 
              documentation, or any technical content you've written.
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Paste a sample of your writing here..."
                  value={newSample}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewSample(e.target.value)}
                  className="flex-1"
                  rows={3}
                />
                <Button 
                  onClick={addWritingSample}
                  disabled={!newSample.trim()}
                  className="self-start"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sample
                </Button>
              </div>
              
              {preferences.writing_samples.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Your Writing Samples ({preferences.writing_samples.length})</h3>
                  {preferences.writing_samples.map((sample, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-muted/50">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <Badge variant="secondary" className="mb-2">
                            Sample {index + 1}
                          </Badge>
                          <p className="text-sm whitespace-pre-wrap line-clamp-3">
                            {sample}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWritingSample(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-brand hover:bg-brand-hover text-white"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}