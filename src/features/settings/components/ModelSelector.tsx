
import React, { useState, useMemo } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { LLMModel } from '../../canvas/types';

interface ModelSelectorProps {
  models: LLMModel[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
  isLoading: boolean;
  compact?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModel, onSelect, isLoading, compact }) => {
  const [open, setOpen] = useState(false);

  const activeModelName = useMemo(() => {
    const model = models.find(m => m.id === selectedModel);
    return model ? model.name : selectedModel;
  }, [models, selectedModel]);

  if (isLoading) {
    return <div className="animate-pulse bg-muted h-9 w-32 rounded-md border border-input"></div>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between h-9 text-xs font-medium",
            compact ? "w-[180px]" : "w-[200px]"
          )}
        >
          <span className="truncate">{activeModelName || "Select model..."}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(compact ? "w-[200px]" : "w-[200px]", "p-0")}>
        <Command>
          <CommandInput placeholder="Search models..." className="h-9 text-xs" />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-xs text-muted-foreground">No models found.</CommandEmpty>
            <CommandGroup>
              {models.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.name} // Command searches by value label usually, or we can use keys. 
                  // Note: shadcn Command uses cmk-dk-combo which searches by children text content by default or value prop.
                  // We should make sure value is unique if possible or just rely on text.
                  // Actually, let's use the name as value for search, but handle selection with ID.
                  onSelect={() => {
                    onSelect(model.id);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <div className="flex flex-col w-full overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{model.name}</span>
                      <Check
                        className={cn(
                          "ml-2 h-3 w-3",
                          selectedModel === model.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate opacity-70">{model.id}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
